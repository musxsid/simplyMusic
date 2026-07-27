import React, { useState, useEffect } from 'react';
import { Play, Disc3, Clock, Heart, ListMusic, ChevronRight, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Home = ({ onPlay }) => {
  const [featuredTrack, setFeaturedTrack] = useState(null);
  const [recentTracks, setRecentTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [featuredRes, recentRes, playlistRes] = await Promise.all([
          api.get('/music/featured').catch(() => ({ data: null })),
          api.get('/music/recent').catch(() => ({ data: [] })),
          api.get('/music/playlists').catch(() => ({ data: [] }))
        ]);
        
        setFeaturedTrack(featuredRes.data);
        setRecentTracks(recentRes.data || []);
        setPlaylists(playlistRes.data || []);
      } catch (err) {
        console.error("Failed to fetch home data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-32 animate-in fade-in duration-500 relative">
      {/* Ambient Background Blobs */}
      <div className="absolute -top-20 left-0 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-float pointer-events-none"></div>
      <div className="absolute top-40 right-0 w-96 h-96 bg-rose-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <header>
        <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-800 dark:text-slate-100 drop-shadow-sm">
          {getGreeting()}
        </h1>
      </header>

      {/* Empty State */}
      {!featuredTrack && recentTracks.length === 0 && playlists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center px-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-none">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Music className="w-10 h-10 text-primary-500" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 mb-3">Your Library is Empty</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-lg">
            It's a bit quiet here. Start building your audiophile collection by uploading your first high-res track.
          </p>
          <button 
            onClick={() => navigate('/upload')}
            className="px-8 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white rounded-full font-bold text-lg shadow-lg shadow-primary-500/30 transition-all hover:scale-105 active:scale-95"
          >
            Upload Music
          </button>
        </div>
      )}

      {/* Hero / Daily Mix Banner */}
      {featuredTrack && (
        <section className="relative w-full h-72 md:h-80 rounded-3xl overflow-hidden shadow-2xl group border border-slate-200/50">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900 to-rose-900">
             {/* Abstract shape inside hero */}
             <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
             <div className="absolute top-10 left-1/2 w-64 h-64 bg-primary-400/20 rounded-full blur-2xl group-hover:-translate-y-10 transition-transform duration-700"></div>
          </div>
          
          <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent">
            <span className="text-primary-300 font-bold tracking-widest text-sm uppercase mb-2 drop-shadow-md">
              Featured Track
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-2 line-clamp-1 drop-shadow-lg">
              {featuredTrack.title}
            </h2>
            <p className="text-slate-300 text-lg md:text-xl font-medium mb-6 drop-shadow-md">
              {featuredTrack.artist} {featuredTrack.album ? `• ${featuredTrack.album}` : ''}
            </p>
            
            <button 
              onClick={() => onPlay(featuredTrack, [featuredTrack])}
              className="w-14 h-14 md:w-16 md:h-16 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-400 hover:scale-105 active:scale-95 transition-all shadow-glow-primary group-hover:shadow-[0_0_40px_rgba(var(--color-primary-500),0.6)]"
            >
              <Play className="w-6 h-6 md:w-8 md:h-8 fill-current ml-1" />
            </button>
          </div>
        </section>
      )}

      {/* Recently Added Carousel */}
      {recentTracks.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Recently Added</h3>
            <button onClick={() => navigate('/library')} className="text-primary-600 font-bold text-sm hover:underline flex items-center">
              See all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-6 pt-2 px-2 -mx-2 no-scrollbar snap-x">
            {recentTracks.map(track => (
              <div 
                key={track.id} 
                onClick={() => onPlay(track, recentTracks)}
                className="snap-start flex-shrink-0 w-40 md:w-48 group cursor-pointer"
              >
                <div className="w-full aspect-square bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 rounded-2xl mb-4 relative overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Disc3 className="w-12 h-12 text-slate-400 dark:text-slate-500 group-hover:text-primary-500 transition-colors duration-300" />
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-glow-primary transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-5 h-5 fill-current ml-1" />
                    </div>
                  </div>
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate px-1 group-hover:text-primary-600 transition-colors">{track.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate px-1">{track.artist}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Playlists Quick Access */}
      {playlists.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Your Playlists</h3>
            <button onClick={() => navigate('/library')} className="text-primary-600 font-bold text-sm hover:underline flex items-center">
              Go to Library <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {playlists.slice(0, 4).map(playlist => (
              <div 
                key={playlist.id}
                onClick={() => navigate('/library')}
                className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 hover:bg-white dark:hover:bg-slate-700/60 hover:shadow-md transition-all cursor-pointer border border-slate-100 dark:border-slate-700 hover:border-primary-200 group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <ListMusic className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{playlist.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{playlist.trackIds?.length || 0} tracks</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default Home;
