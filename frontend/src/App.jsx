import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Music, Upload, Library, LogOut, Activity, Heart } from 'lucide-react';
import keycloak from './keycloak';
import UploadCenter from './components/UploadCenter';
import MusicExplorer from './components/MusicExplorer';
import AudioPlayer from './components/AudioPlayer';
import AnalyticsPanel from './components/AnalyticsPanel';
import Favourites from './components/Favourites';

function App() {
  const [currentTrack, setCurrentTrack] = useState(null);

  const handleLogout = () => {
    keycloak.logout();
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 relative pb-24">
        {/* Navigation Bar */}
        <nav className="sticky top-4 z-50 mx-auto max-w-5xl bg-white/80 backdrop-blur-2xl border border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.05)] rounded-full px-6 py-3 flex items-center justify-between mb-8 transition-all">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-2 rounded-xl text-primary-500 shadow-sm">
              <Music className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-400">
              simplyMusic
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-primary-500 hover:bg-slate-100/80 px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95 font-semibold">
              <Library className="w-5 h-5" />
              <span className="hidden sm:inline">Library</span>
            </Link>
            <Link to="/favourites" className="flex items-center gap-2 text-slate-500 hover:text-primary-500 hover:bg-slate-100/80 px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95 font-semibold">
              <Heart className="w-5 h-5" />
              <span className="hidden sm:inline">Favourites</span>
            </Link>
            <Link to="/upload" className="flex items-center gap-2 text-slate-500 hover:text-primary-500 hover:bg-slate-100/80 px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95 font-semibold">
              <Upload className="w-5 h-5" />
              <span className="hidden sm:inline">Upload</span>
            </Link>
            <Link to="/analytics" className="flex items-center gap-2 text-slate-500 hover:text-primary-500 hover:bg-slate-100/80 px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95 font-semibold">
              <Activity className="w-5 h-5" />
              <span className="hidden sm:inline">Analytics</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-rose-500 transition-colors ml-2 border-l border-slate-200 pl-4 hover:scale-110 active:scale-95">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-6 lg:p-10 relative">
          <Routes>
            <Route path="/" element={<MusicExplorer onPlay={setCurrentTrack} />} />
            <Route path="/favourites" element={<Favourites onPlay={setCurrentTrack} />} />
            <Route path="/upload" element={<UploadCenter />} />
            <Route path="/analytics" element={<AnalyticsPanel />} />
          </Routes>
        </main>

        {/* Global Player */}
        <AudioPlayer track={currentTrack} />
      </div>
    </Router>
  );
}

export default App;
