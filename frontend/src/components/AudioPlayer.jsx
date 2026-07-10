import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, SkipBack, SkipForward, Maximize2 } from 'lucide-react';
import api from '../services/api';
import NowPlayingView from './NowPlayingView';
import FocusModeView from './FocusModeView';
import { useAudioPipeline } from '../context/AudioPipelineContext';

const AudioPlayer = ({ track, queue, onNext, onPrev, ambientColor }) => {
  const audioRef = useRef(null);
  // NEW: The memory lock to prevent double-counting streams
  const recordedTrackId = useRef(null);
  const { initPipeline } = useAudioPipeline();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [streamUrl, setStreamUrl] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    if (track) {
      const fetchStreamUrl = async () => {
        try {
          const blobResponse = await api.get(`/music/stream/${track.id}`, { responseType: 'blob' });
          const url = URL.createObjectURL(blobResponse.data);
          setStreamUrl(url);
        } catch (error) {
          console.error("Failed to load audio stream", error);
        }
      };
      
      fetchStreamUrl();
      setIsPlaying(true);
    }
  }, [track]);

  useEffect(() => {
    if (audioRef.current) {
      // Connect to Web Audio API graph
      initPipeline(audioRef.current);

      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Playback prevented", e));
        
        // NEW: Check if we have already recorded THIS specific track
        if (track && recordedTrackId.current !== track.id) {
          console.log("Recording stream for:", track.title);
          
          // Lock it down immediately so it doesn't fire again
          recordedTrackId.current = track.id;
        }
        
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, streamUrl, track, initPipeline]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current) {
      const seekTime = (e.target.value / 100) * audioRef.current.duration;
      audioRef.current.currentTime = seekTime;
      setProgress(e.target.value);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSkipBack = (e) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0;
        setProgress(0);
      } else {
        if (onPrev) {
          onPrev();
        } else {
          audioRef.current.currentTime = 0;
          setProgress(0);
        }
      }
    }
  };

  const handleSkipForward = (e) => {
    e.stopPropagation();
    if (onNext) {
      onNext(isShuffling);
    } else if (audioRef.current) {
      audioRef.current.currentTime = audioRef.current.duration - 0.1; // Almost end to trigger next or stop
    }
  };

  if (!track) return null;

  return (
    <>
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl z-[100] flex justify-center pointer-events-none">
      <div 
        className="relative w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)] rounded-full transition-all duration-500 cursor-pointer hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden group/player pointer-events-auto flex flex-col"
        onClick={() => setIsExpanded(true)}
      >
      <div className="w-full px-8 py-3 flex items-center justify-between gap-6 relative">
          {/* Track Info */}
          <div className="flex items-center gap-4 w-1/3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <span className="font-bold text-primary-500 text-lg">{track.title?.charAt(0)}</span>
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm">{track.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{track.artist}</p>
            </div>
          </div>

        {/* Controls */}
        <div className="flex flex-col items-center justify-center flex-1 w-full max-w-lg px-4" onClick={(e) => e.stopPropagation()}>
          {/* Progress Bar (Above controls) */}
          <div className="w-full mb-3 h-1 bg-slate-200/80 dark:bg-slate-700/80 rounded-full group relative">
            <input
              type="range"
              min="0"
              max="100"
              value={progress || 0}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 hover:h-2 transition-all"
              onClick={(e) => e.stopPropagation()}
            />
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full relative pointer-events-none transition-all group-hover:h-1.5 group-hover:-mt-0.25"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-primary-500 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={handleSkipBack} className="text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-primary-500 text-white p-2 rounded-full hover:scale-110 active:scale-95 transition-all duration-300 shadow-glow-primary"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <button onClick={handleSkipForward} className="text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>

        {/* Volume & Extras */}
        <div className="flex items-center justify-end gap-4 w-1/3" onClick={(e) => e.stopPropagation()}>
          <Volume2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <div className="relative w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full group">
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume} 
              onChange={handleVolumeChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="bg-primary-500 h-full rounded-full relative pointer-events-none" style={{ width: `${volume * 100}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-slate-200 rounded-full shadow scale-0 group-hover:scale-100 transition-transform"></div>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsFocusMode(true); }}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary-500 transition-colors bg-slate-100 dark:bg-slate-700/50 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-full"
            title="Focus Mode (Visualizer)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {streamUrl && (
        <audio
          ref={audioRef}
          src={streamUrl}
          crossOrigin="anonymous"
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            if (isRepeating) {
              audioRef.current.currentTime = 0;
              audioRef.current.play();
            } else if (onNext) {
              onNext(isShuffling);
            } else {
              setIsPlaying(false);
            }
          }}
        />
      )}
      </div>
    </div>

    {isExpanded && (
      <NowPlayingView
        track={track}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        progress={progress}
        handleSeek={handleSeek}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        handleVolumeChange={handleVolumeChange}
        handleSkipBack={handleSkipBack}
        handleSkipForward={handleSkipForward}
        isRepeating={isRepeating}
        setIsRepeating={setIsRepeating}
        isShuffling={isShuffling}
        setIsShuffling={setIsShuffling}
        ambientColor={ambientColor}
        onClose={() => setIsExpanded(false)}
      />
    )}

    <FocusModeView 
      isOpen={isFocusMode}
      onClose={() => setIsFocusMode(false)}
      track={track}
      isPlaying={isPlaying}
      ambientColor={ambientColor}
      onPlayPause={() => setIsPlaying(!isPlaying)}
      onNext={handleSkipForward}
      onPrev={handleSkipBack}
    />
    </>
  );
};

export default AudioPlayer;