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
      <div className="min-h-screen bg-dark-bg flex flex-col font-sans text-dark-text relative pb-24">
        {/* Navigation Bar */}
        <nav className="glass sticky top-0 z-50 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500/20 p-2 rounded-xl text-primary-400">
              <Music className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-200">
              simplyMusic
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 hover:text-primary-400 transition-colors">
              <Library className="w-5 h-5" />
              <span className="font-medium">Library</span>
            </Link>
            <Link to="/favourites" className="flex items-center gap-2 hover:text-primary-400 transition-colors">
              <Heart className="w-5 h-5" />
              <span className="font-medium">Favourites</span>
            </Link>
            <Link to="/upload" className="flex items-center gap-2 hover:text-primary-400 transition-colors">
              <Upload className="w-5 h-5" />
              <span className="font-medium">Upload</span>
            </Link>
            <Link to="/analytics" className="flex items-center gap-2 hover:text-primary-400 transition-colors">
              <Activity className="w-5 h-5" />
              <span className="font-medium">Analytics</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 text-dark-muted hover:text-red-400 transition-colors ml-4 border-l border-white/10 pl-4">
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
