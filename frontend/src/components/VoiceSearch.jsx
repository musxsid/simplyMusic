import React, { useState, useRef } from 'react';
import { Mic, Loader2, X, Music } from 'lucide-react';
import api from '../services/api';

const VoiceSearch = ({ onMatch }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());

        await handleVoiceSearch(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Stop automatically after 5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 5000);

    } catch (err) {
      console.error("Microphone access denied or error occurred", err);
      alert("Could not access microphone.");
    }
  };

  const handleVoiceSearch = async (blob) => {
    try {
      const formData = new FormData();
      formData.append('file', blob, 'voice-search.webm');

      const response = await api.post('/music/voice-search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      onMatch(response.data);
    } catch (err) {
      console.error("Voice search failed", err);
      alert("Failed to identify song.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={startRecording}
        disabled={isRecording || isProcessing}
        className={`p-3 rounded-full transition-all duration-300 shadow-lg ${
          isRecording 
            ? 'bg-red-500 text-white animate-pulse' 
            : isProcessing 
              ? 'bg-primary-900/50 text-primary-400 cursor-wait'
              : 'bg-dark-card border border-white/10 hover:border-primary-500/50 text-dark-muted hover:text-primary-400'
        }`}
        title="Voice Search (5s)"
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {/* Recording Indicator Toast */}
      {isRecording && (
        <div className="absolute top-24 right-10 glass border border-red-500/30 px-4 py-2 rounded-full flex items-center gap-3 animate-in fade-in slide-in-from-top-4 z-50">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
          <span className="text-sm font-medium text-red-200">Listening (5s)...</span>
        </div>
      )}
    </div>
  );
};

export default VoiceSearch;
