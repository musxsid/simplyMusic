import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Music, Upload, Library, LogOut, Activity, Heart, User, Home as HomeIcon, Sun, Moon, Settings } from 'lucide-react';
import Home from './components/Home';
import UploadCenter from './components/UploadCenter';
import MusicExplorer from './components/MusicExplorer';
import AudioPlayer from './components/AudioPlayer';
import AnalyticsPanel from './components/AnalyticsPanel';
import AppSettingsModal from './components/AppSettingsModal';

const NavBar = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const username = user?.preferred_username || 'User';
  const name = user?.name || username;
  const email = user?.email || '';

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
    <nav className="sticky top-0 z-50 w-full bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 lg:px-8 py-4 flex items-center justify-between mb-8 transition-all">
      {/* Left: Logo */}
      <div className="flex items-center gap-3 w-auto lg:w-1/4 group cursor-pointer" onClick={() => navigate('/')}>
        <div className="bg-gradient-to-br from-primary-400 to-primary-600 p-2.5 rounded-2xl text-white shadow-lg shadow-primary-500/30 hidden sm:flex items-center justify-center transform transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-primary-500/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/20 w-full h-full -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <Music className="w-5 h-5 relative z-10" strokeWidth={2.5} />
        </div>
        <span className="text-2xl font-extrabold tracking-tighter hidden lg:block transition-transform duration-300 group-hover:scale-[1.02]">
          <span className="text-slate-800 dark:text-white">simply</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary-500 to-rose-500">Music</span>
        </span>
      </div>
      
      {/* Center: Sliding Tab Bar */}
      <div className="flex justify-center flex-1 px-2">
        <div className="relative flex items-center p-1 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full shadow-inner border border-slate-200 dark:border-slate-700 w-full max-w-[500px]">
        <div 
          className={`absolute top-1 bottom-1 w-[calc(25%-2px)] bg-white dark:bg-slate-700 rounded-full shadow-sm border border-slate-100 dark:border-slate-600 transition-transform duration-300 ease-in-out ${translateClasses[activeIndex]}`}
        />
        <button
          onClick={() => navigate('/')}
          className={`relative flex-1 py-2 text-xs sm:text-sm font-bold z-10 transition-colors duration-300 flex items-center justify-center gap-1 sm:gap-2 ${activeIndex === 0 ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <HomeIcon className="w-4 h-4 hidden sm:block" /> Home
        </button>
        <button
          onClick={() => navigate('/library')}
          className={`relative flex-1 py-2 text-xs sm:text-sm font-bold z-10 transition-colors duration-300 flex items-center justify-center gap-1 sm:gap-2 ${activeIndex === 1 ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <Library className="w-4 h-4 hidden sm:block" /> Library
        </button>
        <button
          onClick={() => navigate('/upload')}
          className={`relative flex-1 py-2 text-xs sm:text-sm font-bold z-10 transition-colors duration-300 flex items-center justify-center gap-1 sm:gap-2 ${activeIndex === 2 ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <Upload className="w-4 h-4 hidden sm:block" /> Upload
        </button>
        <button
          onClick={() => navigate('/analytics')}
          className={`relative flex-1 py-2 text-xs sm:text-sm font-bold z-10 transition-colors duration-300 flex items-center justify-center gap-1 sm:gap-2 ${activeIndex === 3 ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <Activity className="w-4 h-4 hidden sm:block" /> Analytics
        </button>
        </div>
      </div>

      {/* Right: Profile Dropdown */}
      <div className="flex items-center justify-end gap-4 w-auto lg:w-1/4 relative">
        <button
          onClick={toggleDarkMode}
          className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center hover:shadow-md transition-all active:scale-95 border border-slate-200/50 dark:border-slate-700/50"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)} 
            className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center hover:shadow-md transition-all active:scale-95 border border-primary-200/50 dark:border-primary-800/50"
          >
            <span className="font-extrabold text-lg">{name.charAt(0).toUpperCase()}</span>
          </button>

          {isProfileOpen && (
            <div className="absolute top-14 right-0 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-extrabold text-xl">{name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-800 dark:text-slate-100 truncate">{name}</span>
                  {email && <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{email}</span>}
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="w-full flex items-center justify-between text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 p-3 rounded-xl transition-colors font-bold group mb-1"
              >
                Settings
                <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              </button>
              <button 
                onClick={() => window.location.href = 'http://localhost:8080/logout'} 
                className="w-full flex items-center justify-between text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-3 rounded-xl transition-colors font-bold group"
              >
                Sign Out
                <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Settings Modal */}
      <AppSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
      />
    </nav>
  );
};

function App({ user }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentQueue, setCurrentQueue] = useState([]);
  const [ambientColor, setAmbientColor] = useState('rgba(244, 63, 94, 0.1)'); // Default primary-500 light

  // Helper to generate a vibrant color from a string
  const getStringColor = (str) => {
    if (!str) return 'rgba(244, 63, 94, 0.15)';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsla(${hue}, 80%, 60%, 0.15)`;
  };

  const handlePlay = (track, queue = null) => {
    setCurrentTrack(track);
    setAmbientColor(getStringColor(track.title + track.artist));
    if (queue && queue.length > 0) {
      setCurrentQueue(queue);
    } else {
      setCurrentQueue([track]);
    }
  };

  const handleNext = (isShuffling) => {
    if (currentQueue.length > 0 && currentTrack) {
      if (isShuffling) {
        const randomIndex = Math.floor(Math.random() * currentQueue.length);
        const nextTrack = currentQueue[randomIndex];
        setCurrentTrack(nextTrack);
        setAmbientColor(getStringColor(nextTrack.title + nextTrack.artist));
      } else {
        const currentIndex = currentQueue.findIndex(t => t.id === currentTrack.id);
        if (currentIndex !== -1 && currentIndex < currentQueue.length - 1) {
          const nextTrack = currentQueue[currentIndex + 1];
          setCurrentTrack(nextTrack);
          setAmbientColor(getStringColor(nextTrack.title + nextTrack.artist));
        }
      }
    }
  };

  const handlePrev = () => {
    if (currentQueue.length > 0 && currentTrack) {
      const currentIndex = currentQueue.findIndex(t => t.id === currentTrack.id);
      if (currentIndex > 0) {
        const prevTrack = currentQueue[currentIndex - 1];
        setCurrentTrack(prevTrack);
        setAmbientColor(getStringColor(prevTrack.title + prevTrack.artist));
      }
    }
  };

  return (
    <Router>
      <div 
        className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 relative pb-24 transition-colors duration-1000 overflow-hidden"
      >
        {/* Dynamic Ambient Background layer */}
        <div 
          className="absolute inset-0 transition-colors duration-1000 ease-in-out pointer-events-none z-0"
          style={{ 
            background: `radial-gradient(circle at 50% 0%, ${ambientColor}, transparent 70%)` 
          }}
        />

        <div className="relative z-10 w-full flex flex-col h-full min-h-screen">
          <NavBar user={user} />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-6 lg:p-10 relative">
          <Routes>
            <Route path="/" element={<Home onPlay={handlePlay} />} />
            <Route path="/library" element={<MusicExplorer onPlay={handlePlay} />} />
            <Route path="/upload" element={<UploadCenter />} />
            <Route path="/analytics" element={<AnalyticsPanel onPlay={handlePlay} />} />
          </Routes>
        </main>

        </div>
        
        {/* Global Player */}
        <div className="relative z-50">
          <AudioPlayer 
            track={currentTrack} 
            queue={currentQueue}
            onNext={handleNext}
            onPrev={handlePrev}
            ambientColor={ambientColor}
          />
        </div>
      </div>
    </Router>
  );
}

export default App;
