import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const UploadCenter = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'video/mp4'];
    if (validTypes.includes(selectedFile.type) || selectedFile.name.match(/\.(mp3|wav|mp4)$/i)) {
      setFile(selectedFile);
      setError(null);
      setMetadata(null);
      setProgress(0);
    } else {
      setError('Invalid file type. Only MP3, WAV, and MP4 are supported.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError(null);

    try {
      const response = await api.post('/music/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      setMetadata(response.data);
      setFile(null);
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Upload Center</h1>
        <p className="text-slate-500 mt-2">Add new tracks to your simplyMusic library. We'll automatically extract the metadata.</p>
      </div>

      <div
        className={`glass rounded-3xl p-10 text-center border-2 border-dashed transition-all duration-300 ${
          isDragging ? 'border-primary-500 bg-primary-100/50' : 'border-slate-300 hover:border-primary-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".mp3,.wav,.mp4,audio/*"
        />

        {!file && !metadata && (
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-full mb-4 shadow-neumorphic">
              <UploadCloud className="w-12 h-12 text-primary-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Drag & Drop your audio file</h3>
            <p className="text-slate-500 mb-6">or click below to browse your files</p>
            <button
              onClick={() => fileInputRef.current.click()}
              className="bg-primary-500 hover:bg-primary-400 text-white font-bold py-3 px-8 rounded-full transition-transform active:scale-95 shadow-glow-primary"
            >
              Browse Files
            </button>
            <p className="text-xs text-slate-500 mt-6">Supports MP3, MP4, WAV</p>
          </div>
        )}

        {file && !uploading && !metadata && (
          <div className="flex flex-col items-center">
            <FileAudio className="w-16 h-16 text-primary-300 mb-4" />
            <p className="text-lg font-medium text-slate-800 mb-6 truncate max-w-xs">{file.name}</p>
            <div className="flex gap-4">
              <button
                onClick={() => setFile(null)}
                className="bg-white hover:bg-slate-50 text-slate-800 font-semibold py-2 px-6 rounded-full transition-colors border border-slate-200 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="bg-primary-500 hover:bg-primary-400 text-white font-bold py-2 px-8 rounded-full transition-transform active:scale-95 shadow-glow-primary"
              >
                Upload File
              </button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-6" />
            <div className="w-full bg-slate-200 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-primary-600 to-primary-400 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-primary-200 font-medium">{progress}% Uploading...</p>
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-center justify-center gap-2 text-rose-500 bg-rose-500/10 py-3 px-6 rounded-xl">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {metadata && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="bg-emerald-500/20 p-4 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Upload Complete!</h3>
            
            <div className="w-full text-left bg-white rounded-2xl p-6 mt-4 shadow-sm border border-slate-200">
              <h4 className="text-sm uppercase tracking-widest text-primary-500 font-bold mb-4">Extracted Metadata</h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <p className="text-xs text-slate-500">Title</p>
                  <p className="font-medium">{metadata.title || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Artist</p>
                  <p className="font-medium">{metadata.artist || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Album</p>
                  <p className="font-medium">{metadata.album || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Year</p>
                  <p className="font-medium">{metadata.releaseYear || 'Unknown'}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setMetadata(null)}
              className="mt-8 text-primary-400 hover:text-primary-300 font-medium underline-offset-4 hover:underline"
            >
              Upload another file
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadCenter;
