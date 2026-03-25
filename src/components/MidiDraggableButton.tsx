import React, { useState } from 'react';
import { Music, Play, Square } from 'lucide-react';
import MidiWriter from 'midi-writer-js';
import { generateMidiTrack, PatternLength, PatternVariation, generateAudioLoop } from '../utils/midiGenerator';
import { AppTheme, MidiNote } from '../types';
import { playMidiPreview, stopMidiPreview } from '../utils/midiPlayer';

interface MidiDraggableButtonProps {
  instrument: string;
  loopGuide: string;
  bpm: number;
  bars: PatternLength;
  variation: PatternVariation;
  recipeTitle: string;
  theme: AppTheme;
  dawType?: string | null;
  midiNotes?: MidiNote[];
}

export const MidiDraggableButton: React.FC<MidiDraggableButtonProps> = ({
  instrument,
  loopGuide,
  bpm,
  bars,
  variation,
  recipeTitle,
  theme,
  dawType,
  midiNotes
}) => {
  const [preparedData, setPreparedData] = React.useState<{ url: string, fileName: string, mimeType: string, midiBytes: Uint8Array } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const prepareMidiData = async () => {
    try {
      const track = generateMidiTrack(instrument, loopGuide, bpm, bars, variation, recipeTitle, midiNotes);
      const write = new MidiWriter.Writer(track);
      const midiBytes = write.buildFile();
      
      const isStudioOne = dawType === 'Studio One';
      const extension = isStudioOne ? 'audioloop' : 'mid';
      const fileName = `${recipeTitle.replace(/\s+/g, '_')}_${instrument.replace(/\s+/g, '_')}_${bars}Bar_${variation}_${bpm}BPM.${extension}`;
      
      let downloadUrl: string;
      let mimeType: string;
      
      if (isStudioOne) {
        const blob = await generateAudioLoop(midiBytes, bpm);
        downloadUrl = URL.createObjectURL(blob);
        mimeType = 'application/octet-stream';
      } else {
        const blob = new Blob([midiBytes], { type: 'audio/midi' });
        downloadUrl = URL.createObjectURL(blob);
        mimeType = 'audio/midi';
      }

      setPreparedData({ url: downloadUrl, fileName, mimeType, midiBytes });
    } catch (error) {
      console.error("Failed to prepare MIDI data:", error);
    }
  };

  // Clean up URL on unmount
  React.useEffect(() => {
    return () => {
      if (preparedData) {
        URL.revokeObjectURL(preparedData.url);
      }
    };
  }, [preparedData]);

  const handleDownload = async () => {
    if (!preparedData) {
      await prepareMidiData();
    }
    
    // We need to check again because prepareMidiData is async
    const data = preparedData || await (async () => {
      const track = generateMidiTrack(instrument, loopGuide, bpm, bars, variation, recipeTitle, midiNotes);
      const write = new MidiWriter.Writer(track);
      const midiBytes = write.buildFile();
      const isStudioOne = dawType === 'Studio One';
      const extension = isStudioOne ? 'audioloop' : 'mid';
      const fileName = `${recipeTitle.replace(/\s+/g, '_')}_${instrument.replace(/\s+/g, '_')}_${bars}Bar_${variation}_${bpm}BPM.${extension}`;
      const blob = isStudioOne ? await generateAudioLoop(midiBytes, bpm) : new Blob([midiBytes], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);
      return { url, fileName, mimeType: isStudioOne ? 'application/octet-stream' : 'audio/midi' };
    })();

    const link = document.createElement('a');
    link.href = data.url;
    link.download = data.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (preparedData) {
      // Fix: Don't prepend window.location.origin to blob URLs
      e.dataTransfer.setData('DownloadURL', `${preparedData.mimeType}:${preparedData.fileName}:${preparedData.url}`);
      // Some DAWs also like the file name in plain text
      e.dataTransfer.setData('text/plain', preparedData.fileName);
    }
  };

  const handlePlay = async () => {
    if (isPlaying) {
      stopMidiPreview();
      setIsPlaying(false);
      return;
    }

    if (!preparedData) {
      await prepareMidiData();
    }

    const data = preparedData || await (async () => {
      const track = generateMidiTrack(instrument, loopGuide, bpm, bars, variation, recipeTitle, midiNotes);
      const write = new MidiWriter.Writer(track);
      const midiBytes = write.buildFile();
      return { midiBytes };
    })();

    setIsPlaying(true);
    playMidiPreview(data.midiBytes, instrument, () => {
      setIsPlaying(false);
    });
  };

  return (
    <div className={`flex items-center rounded-md border overflow-hidden ${theme === 'coldest' ? 'border-sky-200' : 'border-white/10'}`}>
      <button
        onClick={handlePlay}
        onMouseEnter={prepareMidiData}
        className={`flex items-center justify-center p-1.5 transition-all hover:bg-opacity-80 ${
          theme === 'coldest' ? 'bg-sky-100 text-sky-700 hover:bg-sky-200' : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
        }`}
        title={isPlaying ? "Stop Preview" : "Play Preview"}
      >
        {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </button>
      <div className={`w-px h-4 ${theme === 'coldest' ? 'bg-sky-200' : 'bg-white/10'}`} />
      <button
        onClick={handleDownload}
        onMouseEnter={prepareMidiData}
        draggable={!!preparedData}
        onDragStart={handleDragStart}
        className={`flex items-center gap-1.5 px-2 py-1 transition-all cursor-grab active:cursor-grabbing text-[10px] font-bold uppercase tracking-widest ${
          theme === 'coldest' ? 'bg-sky-100 text-sky-700 hover:bg-sky-200' : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
        }`}
        title={`Download or Drag ${bars}-Bar MIDI (Pattern ${variation}) for ${instrument}`}
      >
        <Music className="w-3 h-3" />
        <span>{bars} Bar {variation}</span>
      </button>
    </div>
  );
};
