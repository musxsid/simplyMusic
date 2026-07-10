import React, { useState } from 'react';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2 } from 'lucide-react';

const NowPlayingView = ({ 
  track, 
  isPlaying, 
  setIsPlaying, 
  progress, 
  handleSeek, 
  currentTime, 
  duration,
  volume,
  handleVolumeChange,
  handleSkipBack,
  handleSkipForward,
  isRepeating,
  setIsRepeating,
  isShuffling,
  setIsShuffling,
  ambientColor,
  onClose 
}) => {
  if (!track) return null;

  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white/60 dark:bg-slate-900/80 backdrop-blur-3xl flex flex-col items-center justify-between p-6 md:p-12 animate-jelly-popup transition-colors duration-1000 overflow-hidden">
      {/* Ambient Background layer for NowPlaying */}
      <div 
        className="absolute inset-0 transition-colors duration-1000 ease-in-out pointer-events-none z-0 mix-blend-screen dark:mix-blend-lighten"
        style={{ 
          background: `radial-gradient(circle at 50% 50%, ${ambientColor?.replace('0.15', '0.4') || 'rgba(244, 63, 94, 0.4)'}, transparent 80%)` 
        }}
      />
      {/* Top Header */}
      <div className="w-full max-w-4xl flex items-center justify-between relative z-10">
        <button 
          onClick={onClose}
          className="p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full shadow-sm hover:shadow-neumorphic dark:hover:shadow-none transition-all duration-300 hover:scale-105 active:scale-95 text-slate-800 dark:text-slate-100"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
        <span className="text-sm font-bold tracking-widest text-slate-400 uppercase">Now Playing</span>
        <div className="w-12" /> {/* Spacer for centering */}
      </div>

      {/* Center Art / Vinyl */}
      <div className="flex-1 w-full max-w-lg flex flex-col items-center justify-center animate-float">
        <div 
          className="relative w-64 h-64 md:w-80 md:h-80 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-slate-800 flex items-center justify-center p-2 transition-shadow duration-500 animate-spin-slow"
          style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
        >
          {/* Vinyl Grooves */}
          <div className="absolute inset-2 rounded-full border border-slate-700/50"></div>
          <div className="absolute inset-4 rounded-full border border-slate-700/50"></div>
          <div className="absolute inset-6 rounded-full border border-slate-700/50"></div>
          <div className="absolute inset-8 rounded-full border border-slate-700/50"></div>
          <div className="absolute inset-10 rounded-full border border-slate-700/50"></div>
          
          {/* Inner Label */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-primary-400 to-primary-600 shadow-inner flex items-center justify-center">
            {/* Center Hole */}
            <div className="w-4 h-4 rounded-full bg-slate-900 border-2 border-primary-300/50 shadow-inner"></div>
          </div>
          
          {/* Glow reflection */}
          <div className="absolute top-0 right-0 w-full h-full rounded-full bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none"></div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-2xl p-8 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.4)] border border-white/60 dark:border-slate-700/50 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-100 ease-out-expo fill-mode-both relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2 truncate">{track.title}</h2>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400 truncate">{track.artist}</p>
        </div>

        {/* Scrubber */}
        <div className="mb-8">
          <div className="relative w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full shadow-inner mb-2 group">
            <input
              type="range"
              min="0"
              max="100"
              value={progress || 0}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div 
              className="absolute top-0 left-0 h-full bg-primary-500 rounded-full shadow-glow-primary pointer-events-none transition-all duration-100"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-slate-200 rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-6 md:gap-10">
          <button onClick={() => setIsShuffling(!isShuffling)} className={`transition-all hover:scale-110 active:scale-95 ${isShuffling ? 'text-primary-500' : 'text-slate-400 hover:text-primary-500'}`}>
            <Shuffle className="w-5 h-5" />
          </button>
          <button onClick={handleSkipBack} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full shadow-sm text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 hover:shadow-neumorphic dark:hover:shadow-none transition-all hover:scale-110 active:scale-95">
            <SkipBack className="w-6 h-6 fill-current" />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-5 md:p-6 bg-primary-500 text-white rounded-full shadow-glow-primary hover:bg-primary-400 transition-all hover:scale-110 active:scale-95"
          >
            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
          </button>
          <button onClick={handleSkipForward} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full shadow-sm text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 hover:shadow-neumorphic dark:hover:shadow-none transition-all hover:scale-110 active:scale-95">
            <SkipForward className="w-6 h-6 fill-current" />
          </button>
          <button onClick={() => setIsRepeating(!isRepeating)} className={`transition-all hover:scale-110 active:scale-95 ${isRepeating ? 'text-primary-500' : 'text-slate-400 hover:text-primary-500'}`}>
            <Repeat className="w-5 h-5" />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <Volume2 className="w-5 h-5 text-slate-400" />
          <div className="relative w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full group shadow-inner">
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
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border border-slate-200 rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NowPlayingView;
