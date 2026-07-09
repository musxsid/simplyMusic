import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Music, Upload, Library, LogOut, Activity, Heart, User, Home as HomeIcon } from 'lucide-react';
import keycloak from './keycloak';
import Home from './components/Home';
import UploadCenter from './components/UploadCenter';
import MusicExplorer from './components/MusicExplorer';
import AudioPlayer from './components/AudioPlayer';
import AnalyticsPanel from './components/AnalyticsPanel';

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const username = keycloak.tokenParsed?.preferred_username || 'User';
  const name = keycloak.tokenParsed?.name || username;
  const email = keycloak.tokenParsed?.email || '';

  let activeIndex = 0;
  if (location.pathname === '/library') activeIndex = 1;
  else if (location.pathname === '/upload') activeIndex = 2;
  else if (location.pathname === '/analytics') activeIndex = 3;

  // Responsive translation classes for the active pill using percentages
  const translateClasses = [
    'translate-x-0',
    'translate-x-[100%]',
    'translate-x-[200%]',
    'translate-x-[300%]'
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/50 px-4 lg:px-8 py-4 flex items-center justify-between mb-8 transition-all">
      {/* Left: Logo */}
      <div className="flex items-center gap-3 w-auto lg:w-1/4">
        <div className="bg-primary-100 p-2 rounded-xl text-primary-500 shadow-sm hidden sm:block">
          <Music className="w-6 h-6" />
        </div>
        <span className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-400 hidden lg:block">
          simplyMusic
        </span>
      </div>
      
      {/* Center: Sliding Tab Bar */}
      <div className="flex justify-center flex-1 px-2">
        <div className="relative flex items-center p-1 bg-slate-200/50 backdrop-blur-md rounded-full shadow-inner border border-slate-200 w-full max-w-[500px]">
        <div 
          className={`absolute top-1 bottom-1 w-[calc(25%-2px)] bg-white rounded-full shadow-sm border border-slate-100 transition-transform duration-300 ease-in-out ${translateClasses[activeIndex]}`}
        />
        <button
          onClick={() => navigate('/')}
          className={`relative flex-1 py-2 text-xs sm:text-sm font-bold z-10 transition-colors duration-300 flex items-center justify-center gap-1 sm:gap-2 ${activeIndex === 0 ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <HomeIcon className="w-4 h-4 hidden sm:block" /> Home
        </button>
        <button
          onClick={() => navigate('/library')}
          className={`relative flex-1 py-2 text-xs sm:text-sm font-bold z-10 transition-colors duration-300 flex items-center justify-center gap-1 sm:gap-2 ${activeIndex === 1 ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Library className="w-4 h-4 hidden sm:block" /> Library
        </button>
        <button
          onClick={() => navigate('/upload')}
          className={`relative flex-1 py-2 text-xs sm:text-sm font-bold z-10 transition-colors duration-300 flex items-center justify-center gap-1 sm:gap-2 ${activeIndex === 2 ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Upload className="w-4 h-4 hidden sm:block" /> Upload
        </button>
        <button
          onClick={() => navigate('/analytics')}
          className={`relative flex-1 py-2 text-xs sm:text-sm font-bold z-10 transition-colors duration-300 flex items-center justify-center gap-1 sm:gap-2 ${activeIndex === 3 ? 'text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Activity className="w-4 h-4 hidden sm:block" /> Analytics
        </button>
        </div>
      </div>

      {/* Right: Profile Dropdown */}
      <div className="flex items-center justify-end w-auto lg:w-1/4 relative">
        <button 
          onClick={() => setIsProfileOpen(!isProfileOpen)} 
          className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 text-primary-600 rounded-full flex items-center justify-center hover:shadow-md transition-all active:scale-95 border border-primary-200/50"
        >
          <span className="font-extrabold text-lg">{name.charAt(0).toUpperCase()}</span>
        </button>

        {isProfileOpen && (
          <div className="absolute top-14 right-0 w-64 bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-2xl rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="font-extrabold text-xl">{name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-800 truncate">{name}</span>
                {email && <span className="text-xs text-slate-500 truncate">{email}</span>}
              </div>
            </div>
            <button 
              onClick={() => keycloak.logout()} 
              className="w-full flex items-center justify-between text-rose-600 hover:bg-rose-50 p-3 rounded-xl transition-colors font-bold group"
            >
              Sign Out
              <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

function App() {
  const [currentTrack, setCurrentTrack] = useState(null);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 relative pb-24">
        <NavBar />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-6 lg:p-10 relative">
          <Routes>
            <Route path="/" element={<Home onPlay={setCurrentTrack} />} />
            <Route path="/library" element={<MusicExplorer onPlay={setCurrentTrack} />} />
            <Route path="/upload" element={<UploadCenter />} />
            <Route path="/analytics" element={<AnalyticsPanel onPlay={setCurrentTrack} />} />
          </Routes>
        </main>

        {/* Global Player */}
        <AudioPlayer track={currentTrack} />
      </div>
    </Router>
  );
}

export default App;
