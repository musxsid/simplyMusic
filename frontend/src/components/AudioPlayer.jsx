import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, SkipBack, SkipForward } from 'lucide-react';
import api from '../services/api';

const AudioPlayer = ({ track }) => {
  const audioRef = useRef(null);
  // NEW: The memory lock to prevent double-counting streams
  const recordedTrackId = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [streamUrl, setStreamUrl] = useState(null);

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
  }, [isPlaying, streamUrl, track]); // Added track to dependency array

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
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

  if (!track) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 z-50 transform transition-transform translate-y-0">
      {/* Progress Bar (Full Width Top) */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-dark-bg/50">
        <input
          type="range"
          min="0"
          max="100"
          value={progress || 0}
          onChange={handleSeek}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div 
          className="h-full bg-gradient-to-r from-primary-600 to-primary-400"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between gap-4">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-1/3 min-w-0">
          <div className="w-14 h-14 rounded-lg bg-dark-bg flex items-center justify-center flex-shrink-0 border border-white/5 shadow-md">
            <span className="font-bold text-primary-400 text-xl">{track.title?.charAt(0)}</span>
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-white truncate">{track.title}</h4>
            <p className="text-sm text-dark-muted truncate">{track.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="flex items-center gap-6">
            <button className="text-dark-muted hover:text-white transition-colors">
              <SkipBack className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-white text-black p-3 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>
            <button className="text-dark-muted hover:text-white transition-colors">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Volume & Extras */}
        <div className="flex items-center justify-end gap-4 w-1/3">
          <Volume2 className="w-5 h-5 text-dark-muted" />
          <div className="w-24 h-1 bg-dark-bg rounded-full overflow-hidden">
            <div className="bg-primary-400 h-full w-2/3"></div>
          </div>
        </div>
      </div>

      {streamUrl && (
        <audio
          ref={audioRef}
          src={streamUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
};

export default AudioPlayer;