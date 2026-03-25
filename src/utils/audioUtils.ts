
/**
 * Processes an audio file to make it suitable for AI analysis.
 * Trims to 60 seconds, downmixes to mono, and reduces sample rate.
 */
export async function processAudioForAnalysis(file: File): Promise<{ base64: string, mimeType: string }> {
  const MAX_DURATION = 300; // Increased from 30 to 300 seconds (5 minutes) for full song analysis
  const TARGET_SAMPLE_RATE = 16000; // 16kHz is plenty for mix critique and keeps file size small

  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: TARGET_SAMPLE_RATE // Try to set sample rate early
  });
  
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch (e) {
    // If decoding fails, it might be due to sample rate mismatch or format issues
    // We'll try one more time with a fresh context if possible, but usually this is a format issue
    console.error("Audio decoding failed", e);
    throw new Error("Could not decode audio file. Please try a standard MP3 under 20MB.");
  }

  // If the buffer is huge, we might hit memory limits. 
  // We'll only take the first 30 seconds.
  const duration = Math.min(audioBuffer.duration, MAX_DURATION);
  const offlineCtx = new OfflineAudioContext(
    1, // mono
    Math.floor(duration * TARGET_SAMPLE_RATE),
    TARGET_SAMPLE_RATE
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  
  // Encode to WAV
  const wavBlob = bufferToWav(renderedBuffer);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: 'audio/wav' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(wavBlob);
  });
}

function bufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);  // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit (hardcoded)

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  // write interleaved data
  for(i = 0; i < buffer.numberOfChannels; i++)
    channels.push(buffer.getChannelData(i));

  while(pos < length) {
    for(i = 0; i < numOfChan; i++) {             // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true);          // write 16-bit sample
      pos += 2;
    }
    offset++;                                     // next source sample
  }

  return new Blob([bufferArray], {type: "audio/wav"});

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
