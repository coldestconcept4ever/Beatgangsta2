import MidiPlayer from 'midi-player-js';

let audioCtx: AudioContext | null = null;
let activeOscillators: Map<number, { osc: OscillatorNode, gain: GainNode }> = new Map();
let currentPlayer: any = null;

const noteToFreq = (note: number) => 440 * Math.pow(2, (note - 69) / 12);

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const getSynthParams = (instrumentType: string, noteNumber?: number) => {
  const text = instrumentType.toLowerCase();
  const isDrums = text.includes('drum') || text.includes('perc') || text.includes('kick') || text.includes('snare') || text.includes('hat') || text.includes('clap');

  // If it's a drum pattern, use the note number to decide the sound
  if (isDrums && noteNumber !== undefined) {
    if (noteNumber === 36) { // Kick (C1)
      return { type: 'sine' as OscillatorType, attack: 0.005, decay: 0.3, sustain: 0, release: 0.1, filterFreq: 150, pitchDrop: true };
    } else if (noteNumber === 38) { // Snare (D1)
      return { type: 'triangle' as OscillatorType, attack: 0.005, decay: 0.15, sustain: 0, release: 0.1, filterFreq: 3000, noise: true };
    } else if (noteNumber === 39) { // Clap (D#1)
      return { type: 'triangle' as OscillatorType, attack: 0.01, decay: 0.2, sustain: 0, release: 0.15, filterFreq: 2500, noise: true, clap: true };
    } else if (noteNumber === 42) { // Hi-Hat (F#1)
      return { type: 'square' as OscillatorType, attack: 0.002, decay: 0.05, sustain: 0, release: 0.05, filterFreq: 10000, noise: true };
    }
  }

  // Fallback to instrument name matching
  if (text.includes('808') || text.includes('bass') || text.includes('sub')) {
    return { type: 'sine' as OscillatorType, attack: 0.05, decay: 0.8, sustain: 0.2, release: 0.5, filterFreq: 400 };
  } else if (text.includes('kick')) {
    return { type: 'sine' as OscillatorType, attack: 0.01, decay: 0.4, sustain: 0, release: 0.1, filterFreq: 150, pitchDrop: true };
  } else if (text.includes('snare')) {
    return { type: 'triangle' as OscillatorType, attack: 0.01, decay: 0.2, sustain: 0, release: 0.1, filterFreq: 3000, noise: true };
  } else if (text.includes('clap')) {
    return { type: 'triangle' as OscillatorType, attack: 0.01, decay: 0.2, sustain: 0, release: 0.15, filterFreq: 2500, noise: true, clap: true };
  } else if (text.includes('hat')) {
    return { type: 'square' as OscillatorType, attack: 0.01, decay: 0.1, sustain: 0, release: 0.05, filterFreq: 8000, noise: true };
  } else if (text.includes('chord') || text.includes('pad')) {
    return { type: 'sawtooth' as OscillatorType, attack: 0.2, decay: 0.5, sustain: 0.8, release: 1.0, filterFreq: 2000 };
  } else {
    // default melody
    return { type: 'square' as OscillatorType, attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.3, filterFreq: 3000 };
  }
};

let currentOnStop: (() => void) | null = null;

export const playMidiPreview = (midiBytes: Uint8Array, instrumentType: string, onStop?: () => void) => {
  initAudio();
  if (!audioCtx) return;

  // Stop current playback if any
  stopMidiPreview();

  currentOnStop = onStop || null;

  currentPlayer = new MidiPlayer.Player((event: any) => {
    if (!audioCtx) return;
    
    if (event.name === 'Note on' && event.velocity > 0) {
      const params = getSynthParams(instrumentType, event.noteNumber);
      const freq = noteToFreq(event.noteNumber);
      
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime((event.velocity / 127) * 0.3, audioCtx.currentTime + params.attack);
      gainNode.gain.exponentialRampToValueAtTime(((event.velocity / 127) * 0.3) * params.sustain + 0.01, audioCtx.currentTime + params.attack + params.decay);
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = params.noise ? 'highpass' : 'lowpass';
      filter.frequency.value = params.filterFreq;
      
      gainNode.connect(filter);
      filter.connect(audioCtx.destination);

      const osc = audioCtx.createOscillator();
      osc.type = params.type;
      
      if (params.pitchDrop) {
        osc.frequency.setValueAtTime(freq * 2, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq / 2, audioCtx.currentTime + params.decay);
      } else {
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      }
      
      osc.connect(gainNode);
      osc.start();

      let noiseOsc: any = null;
      if (params.noise) {
        // Simple noise approximation using a high-frequency square wave modulated
        noiseOsc = audioCtx.createOscillator();
        noiseOsc.type = 'square';
        noiseOsc.frequency.value = Math.random() * 2000 + 4000;
        noiseOsc.connect(gainNode);
        noiseOsc.start();
      }

      // Special clap effect: multiple quick bursts
      if ((params as any).clap) {
        const now = audioCtx.currentTime;
        const burstCount = 3;
        const burstInterval = 0.01;
        for (let i = 0; i < burstCount; i++) {
          const burstTime = now + i * burstInterval;
          gainNode.gain.setValueAtTime(0, burstTime);
          gainNode.gain.linearRampToValueAtTime((event.velocity / 127) * 0.4, burstTime + 0.002);
          gainNode.gain.linearRampToValueAtTime(0, burstTime + 0.008);
        }
        // Final main burst
        const finalTime = now + burstCount * burstInterval;
        gainNode.gain.setValueAtTime(0, finalTime);
        gainNode.gain.linearRampToValueAtTime((event.velocity / 127) * 0.3, finalTime + params.attack);
        gainNode.gain.exponentialRampToValueAtTime(((event.velocity / 127) * 0.3) * params.sustain + 0.01, finalTime + params.attack + params.decay);
      }

      activeOscillators.set(event.noteNumber, { osc, gain: gainNode });
      if (noiseOsc) {
        // Just store the main osc to stop it later, noise will stop when gain goes to 0
        (osc as any).noiseOsc = noiseOsc;
      }

    } else if (event.name === 'Note off' || (event.name === 'Note on' && event.velocity === 0)) {
      const params = getSynthParams(instrumentType, event.noteNumber);
      const active = activeOscillators.get(event.noteNumber);
      if (active) {
        active.gain.gain.cancelScheduledValues(audioCtx.currentTime);
        active.gain.gain.setValueAtTime(active.gain.gain.value, audioCtx.currentTime);
        active.gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + params.release);
        
        active.osc.stop(audioCtx.currentTime + params.release);
        if ((active.osc as any).noiseOsc) {
          (active.osc as any).noiseOsc.stop(audioCtx.currentTime + params.release);
        }
        
        activeOscillators.delete(event.noteNumber);
      }
    }
  });

  currentPlayer.on('endOfFile', () => {
    stopMidiPreview();
  });

  currentPlayer.loadArrayBuffer(midiBytes.buffer);
  currentPlayer.play();
};

export const stopMidiPreview = () => {
  if (currentPlayer) {
    currentPlayer.stop();
    currentPlayer = null;
  }

  // Call the stored onStop callback
  if (currentOnStop) {
    const callback = currentOnStop;
    currentOnStop = null;
    callback();
  }
  
  if (audioCtx) {
    activeOscillators.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(audioCtx.currentTime);
        gain.gain.setValueAtTime(gain.gain.value, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.stop(audioCtx.currentTime + 0.1);
        if ((osc as any).noiseOsc) {
          (osc as any).noiseOsc.stop(audioCtx.currentTime + 0.1);
        }
      } catch (e) {
        // Ignore errors if already stopped
      }
    });
    activeOscillators.clear();
  }
};
