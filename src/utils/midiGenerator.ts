import MidiWriter from 'midi-writer-js';
import { DrumPattern, MidiNote } from '../types';

// Dynamic import for JSZip
const getJSZip = () => import('jszip').then(m => m.default);

export type PatternLength = 4 | 8;
export type PatternVariation = 'A' | 'B';

export const generateDrumMidiBaseData = (
  currentPattern: DrumPattern,
  recipeTitle: string,
  activeSection: string,
  bpm: number,
  useVelocityHumanization: boolean
): Uint8Array => {
  if (!currentPattern) return new Uint8Array();
  const track = new MidiWriter.Track();
  track.addTrackName(`${recipeTitle} - ${activeSection} Drums`);
  track.setTempo(bpm);

  const addDrumEvents = (steps: number[], pitch: string, isDoubleTime: boolean) => {
    const totalSteps = isDoubleTime ? 32 : 16;
    const stepDuration = isDoubleTime ? '32' : '16';
    
    let currentWait = 0;
    
    for (let i = 1; i <= totalSteps; i++) {
      if (steps.includes(i)) {
        const velocity = useVelocityHumanization ? Math.floor(60 + (Math.sin(i * 12.5) * 20 + 20)) : 100;
        const waitStr = currentWait > 0 ? `T${currentWait * (isDoubleTime ? 16 : 32)}` : '0';
        track.addEvent(new MidiWriter.NoteEvent({ pitch: [pitch], duration: stepDuration, wait: waitStr, velocity }));
        currentWait = 0;
      } else {
        currentWait++;
      }
    }
  };

  // General MIDI Drum Map: Kick = 36 (C1), Snare = 38 (D1), Clap = 39 (D#1), Hi-Hat = 42 (F#1)
  addDrumEvents(currentPattern.kick?.steps || [], 'C1', currentPattern.kick?.isDoubleTime || false);
  const snareNote = currentPattern.snare?.isClap ? 'D#1' : 'D1';
  addDrumEvents(currentPattern.snare?.steps || [], snareNote, currentPattern.snare?.isDoubleTime || false);
  addDrumEvents(currentPattern.hiHat?.steps || [], 'F#1', currentPattern.hiHat?.isDoubleTime || false);

  const write = new MidiWriter.Writer(track);
  return write.buildFile();
};

export const isMidiCapable = (instrument: string, loopGuide: string): boolean => {
  const text = (instrument + ' ' + loopGuide).toLowerCase();
  const nonMidiKeywords = ['vocal', 'acapella', 'live guitar', 'live bass', 'acoustic guitar', 'sample loop', 'audio loop', 'real guitar', 'real bass'];
  return !nonMidiKeywords.some(keyword => text.includes(keyword));
};

export const generateAudioLoop = async (midiData: Uint8Array, bpm: number): Promise<Blob> => {
  const JSZip = await getJSZip();
  const zip = new JSZip();
  
  // Audio.mid is used inside an audioloop for MIDI data
  zip.file("Audio.mid", midiData);
  
  // Basic AudioLoop.xml metadata with BPM context
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<AudioLoop version="1.1">
  <Audio>
    <File name="Audio.mid"/>
  </Audio>
  <Context>
    <BPM value="${bpm}"/>
  </Context>
</AudioLoop>`;
  
  zip.file("AudioLoop.xml", xmlContent);
  
  return await zip.generateAsync({ 
    type: "blob",
    compression: "STORE",
    mimeType: "application/octet-stream"
  });
};

export const getVibeParameters = (text: string, recipeTitle: string) => {
  const title = recipeTitle.toLowerCase();
  
  // Base parameters
  let density = 0.5; // 0 to 1
  let swing = 0.0;   // 0 to 1
  let complexity = 0.5; // 0 to 1

  // Adjust based on keywords
  if (text.includes('fast') || text.includes('16th') || text.includes('32nd')) density += 0.3;
  if (text.includes('slow') || text.includes('sustained') || text.includes('long')) density -= 0.3;
  if (text.includes('syncopat') || text.includes('bounce') || text.includes('groove')) swing += 0.4;
  
  // Genre/Style heuristics
  if (title.includes('trap')) { density += 0.2; swing += 0.2; }
  if (title.includes('drill')) { density += 0.3; complexity += 0.2; }
  if (title.includes('rage')) { density += 0.4; complexity += 0.3; }
  if (title.includes('lofi')) { density -= 0.2; swing += 0.5; }
  if (title.includes('crank dat')) { density += 0.2; swing += 0.3; }

  return {
    density: Math.max(0, Math.min(1, density)),
    swing: Math.max(0, Math.min(1, swing)),
    complexity: Math.max(0, Math.min(1, complexity))
  };
};

export const generateMidiTrack = (
  instrument: string,
  loopGuide: string,
  bpm: number,
  bars: PatternLength,
  variation: PatternVariation,
  recipeTitle: string,
  midiNotes?: MidiNote[]
): MidiWriter.Track => {
  const track = new MidiWriter.Track();
  track.addTrackName(instrument);
  track.setTempo(bpm);

  if (midiNotes && midiNotes.length > 0) {
    const getTicks = (val: string | string[] | undefined): number => {
      if (!val) return 0;
      const str = Array.isArray(val) ? val[0] : val;
      if (str === '0') return 0;
      let base = 0;
      const isDotted = str.toLowerCase().includes('d');
      const isTriplet = str.toLowerCase().includes('t');
      const num = str.replace(/[^0-9]/g, '');
      if (num === '1') base = 512;
      else if (num === '2') base = 256;
      else if (num === '4') base = 128;
      else if (num === '8') base = 64;
      else if (num === '16') base = 32;
      else if (num === '32') base = 16;
      else if (num === '64') base = 8;
      
      if (isDotted) base *= 1.5;
      if (isTriplet) base = base * 2 / 3;
      return Math.round(base);
    };

    let sequenceTicks = 0;
    midiNotes.forEach(note => {
      sequenceTicks += getTicks(note.duration) + getTicks(note.wait);
    });

    const targetTicks = bars * 512; // 4/4 time, 1 bar = 512 ticks
    let currentTicks = 0;
    const events: MidiWriter.NoteEvent[] = [];

    // If sequence is empty or invalid, fallback to 1 bar length to avoid infinite loop
    if (sequenceTicks <= 0) sequenceTicks = 512;

    // Loop the sequence until we reach the target number of bars
    let loopCount = 0;
    while (currentTicks < targetTicks && loopCount < 32) {
      midiNotes.forEach(note => {
        // Only add note if it starts within the target duration
        const noteWaitTicks = getTicks(note.wait);
        if (currentTicks + noteWaitTicks < targetTicks) {
          // If the note extends beyond the target duration, we could truncate it, 
          // but MidiWriterJS handles it fine. We'll just add it.
          let pitchArray: string[];
          if (Array.isArray(note.pitch)) {
            pitchArray = note.pitch;
          } else if (typeof note.pitch === 'string' && note.pitch.includes(',')) {
            pitchArray = note.pitch.split(',').map(p => p.trim());
          } else {
            pitchArray = [note.pitch];
          }

          events.push(new MidiWriter.NoteEvent({ 
            pitch: pitchArray, 
            duration: note.duration, 
            wait: note.wait, 
            velocity: note.velocity 
          }));
        }
        currentTicks += noteWaitTicks + getTicks(note.duration);
      });
      loopCount++;
    }

    track.addEvent(events);
    return track;
  }

  const text = (instrument + ' ' + loopGuide).toLowerCase();
  const vibe = getVibeParameters(text, recipeTitle);
  
  let type = 'melody';
  if (text.includes('808') || text.includes('bass') || text.includes('sub')) type = 'bass';
  else if (text.includes('chord') || text.includes('pad') || text.includes('keys') || text.includes('piano')) type = 'chords';
  else if (text.includes('arp')) type = 'arp';
  else if (text.includes('kick')) type = 'kick';
  else if (text.includes('snare') || text.includes('clap')) type = 'snare';
  else if (text.includes('hat')) type = 'hihat';
  else if (text.includes('drum') || text.includes('perc')) type = 'drums';

  const events: MidiWriter.NoteEvent[] = [];

  const pushNote = (pitch: string | string[], duration: string, wait: string | string[] = '0') => {
    // Use vibe parameters to influence velocity and note choice
    const baseVelocity = 70 + Math.floor(vibe.density * 40);
    const velocity = baseVelocity + Math.floor(Math.random() * 20);
    events.push(new MidiWriter.NoteEvent({ pitch: Array.isArray(pitch) ? pitch : [pitch], duration, wait, velocity }));
  };

  // Map vibe parameters to old logic variables
  const isFast = vibe.density > 0.6;
  const isSyncopated = vibe.swing > 0.4;
  const isCrankDat = recipeTitle.toLowerCase().includes('crank dat');

  if (type === 'chords') {
    const chordsA = [['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4']];
    const chordsB = [['D4', 'F4', 'A4'], ['G3', 'B3', 'D4'], ['C4', 'E4', 'G4'], ['A3', 'C4', 'E4']];
    const chords = variation === 'A' ? chordsA : chordsB;
    
    for (let i = 0; i < bars; i++) {
      const chord = chords[i % chords.length];
      const isTurnaround = bars === 8 && (i === 3 || i === 7);
      
      if (isCrankDat) {
        // Crank Dat style chord pattern
        pushNote(chord, '8'); pushNote(chord, '8', '8'); pushNote(chord, '4'); pushNote(chord, '8'); pushNote(chord, '8', '8');
      } else if (isFast) {
        if (isTurnaround) {
          pushNote(chord, '8'); pushNote(chord, '8'); pushNote(chord, '4'); pushNote(chord, '4'); pushNote(chord, '4');
        } else {
          pushNote(chord, '4'); pushNote(chord, '4'); pushNote(chord, '4'); pushNote(chord, '4');
        }
      } else if (isSyncopated) {
        if (isTurnaround) {
          pushNote(chord, '4'); pushNote(chord, '8', '8'); pushNote(chord, '8', '8'); pushNote(chord, '8', '8');
        } else {
          pushNote(chord, '4'); pushNote(chord, '8', '8'); pushNote(chord, '4', '4');
        }
      } else {
        if (isTurnaround) {
          pushNote(chord, '2'); pushNote(chord, '2');
        } else {
          pushNote(chord, '1');
        }
      }
    }
  } else if (type === 'bass') {
    const rootNotesA = ['C2', 'A1', 'F1', 'G1'];
    const rootNotesB = ['D2', 'G1', 'C2', 'A1'];
    const notes = variation === 'A' ? rootNotesA : rootNotesB;
    
    for (let i = 0; i < bars; i++) {
      const note = notes[i % notes.length];
      const isTurnaround = bars === 8 && (i === 3 || i === 7);
      
      if (isCrankDat) {
        // Crank Dat style bass pattern
        pushNote(note, '4'); pushNote(note, '8', '8'); pushNote(note, '4'); pushNote(note, '8', '8');
      } else if (isSyncopated) {
        if (isTurnaround) {
          pushNote(note, '8'); pushNote(note, '8', '8'); pushNote(note, '8', '8'); pushNote(note, '8', '8'); pushNote(note, '8');
        } else {
          pushNote(note, '8'); pushNote(note, '8', '8'); pushNote(note, '4', '8'); pushNote(note, '8', '8');
        }
      } else if (isFast) {
        if (isTurnaround) {
          for(let j=0; j<6; j++) pushNote(note, '8');
          pushNote(note, '16'); pushNote(note, '16'); pushNote(note, '16'); pushNote(note, '16');
        } else {
          for(let j=0; j<8; j++) pushNote(note, '8');
        }
      } else {
        if (isTurnaround) {
          pushNote(note, '2'); pushNote(note, '4'); pushNote(note, '4');
        } else {
          pushNote(note, '1');
        }
      }
    }
  } else if (type === 'arp') {
    const scale = ['C4', 'E4', 'G4', 'C5'];
    for (let i = 0; i < bars * 4; i++) {
      const isTurnaround = bars === 8 && (i >= 28); // last bar
      if (isFast) {
        if (isTurnaround && i % 2 === 1) {
          pushNote(scale[3], '16'); pushNote(scale[2], '16'); pushNote(scale[1], '16'); pushNote(scale[0], '16');
        } else {
          pushNote(scale[0], '16'); pushNote(scale[1], '16'); pushNote(scale[2], '16'); pushNote(scale[3], '16');
        }
      } else {
        if (isTurnaround) {
          pushNote(scale[0], '16'); pushNote(scale[1], '16'); pushNote(scale[2], '16'); pushNote(scale[3], '16');
        } else {
          pushNote(scale[0], '8'); pushNote(scale[1], '8');
        }
      }
    }
  } else if (type === 'hihat') {
    for (let i = 0; i < bars * 4; i++) {
      const isTurnaround = bars === 8 && (i === 15 || i === 31); // 4th and 8th bar last beat
      if (isFast || variation === 'B') {
        if (isTurnaround) {
          for(let j=0; j<8; j++) pushNote('F#1', '32'); // roll
        } else {
          pushNote('F#1', '16'); pushNote('F#1', '16'); pushNote('F#1', '16'); pushNote('F#1', '16');
        }
      } else {
        if (isTurnaround) {
          pushNote('F#1', '16'); pushNote('F#1', '16'); pushNote('F#1', '16'); pushNote('F#1', '16');
        } else {
          pushNote('F#1', '8'); pushNote('F#1', '8');
        }
      }
    }
  } else if (type === 'kick') {
    for (let i = 0; i < bars; i++) {
      const isTurnaround = bars === 8 && (i === 3 || i === 7);
      if (variation === 'A') {
        if (isTurnaround) {
          pushNote('C1', '4'); pushNote('C1', '8', '8'); pushNote('C1', '8', '8'); pushNote('C1', '8', '8');
        } else {
          pushNote('C1', '4'); pushNote('C1', '8', '8'); pushNote('C1', '4', '4');
        }
      } else {
        if (isTurnaround) {
          pushNote('C1', '4'); pushNote('C1', '8', '8'); pushNote('C1', '4'); pushNote('C1', '4');
        } else {
          pushNote('C1', '4'); pushNote('C1', '4', '4'); pushNote('C1', '4');
        }
      }
    }
  } else if (type === 'snare') {
    const snareNote = text.includes('clap') ? 'D#1' : 'D1';
    for (let i = 0; i < bars; i++) {
      const isTurnaround = bars === 8 && (i === 3 || i === 7);
      if (isTurnaround) {
        pushNote(snareNote, '4', '4'); pushNote(snareNote, '8', '4'); pushNote(snareNote, '8');
      } else {
        pushNote(snareNote, '4', '4'); pushNote(snareNote, '4', '4');
      }
    }
  } else {
    // Melody
    const scale = variation === 'A' ? ['C4', 'D4', 'E4', 'G4'] : ['A4', 'G4', 'E4', 'C4'];
    for (let i = 0; i < bars; i++) {
      const isTurnaround = bars === 8 && (i === 3 || i === 7);
      if (isFast) {
        if (isTurnaround) {
          pushNote(scale[0], '16'); pushNote(scale[1], '16'); pushNote(scale[2], '16'); pushNote(scale[3], '16');
          pushNote(scale[3], '16'); pushNote(scale[2], '16'); pushNote(scale[1], '16'); pushNote(scale[0], '16');
          pushNote(scale[0], '8'); pushNote(scale[1], '8'); pushNote(scale[2], '8'); pushNote(scale[3], '8');
        } else {
          pushNote(scale[0], '8'); pushNote(scale[1], '8'); pushNote(scale[2], '8'); pushNote(scale[3], '8');
          pushNote(scale[3], '8'); pushNote(scale[2], '8'); pushNote(scale[1], '8'); pushNote(scale[0], '8');
        }
      } else if (isSyncopated) {
        if (isTurnaround) {
          pushNote(scale[0], '8'); pushNote(scale[1], '8', '8'); pushNote(scale[2], '8', '8'); pushNote(scale[3], '8', '8'); pushNote(scale[0], '8');
        } else {
          pushNote(scale[0], '8'); pushNote(scale[1], '8', '8'); pushNote(scale[2], '4', '8'); pushNote(scale[3], '8', '8');
        }
      } else {
        if (isTurnaround) {
          pushNote(scale[0], '8'); pushNote(scale[1], '8'); pushNote(scale[2], '4'); pushNote(scale[3], '4'); pushNote(scale[0], '4');
        } else {
          pushNote(scale[0], '4'); pushNote(scale[1], '4'); pushNote(scale[2], '4'); pushNote(scale[3], '4');
        }
      }
    }
  }

  track.addEvent(events);
  return track;
};
