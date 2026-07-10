import React, { useState, useEffect } from 'react';
import { Activity, UploadCloud, PlayCircle, History, Clock, Disc3, Play } from 'lucide-react';
import keycloak from '../keycloak';
import api from '../services/api';

const AnalyticsPanel = ({ onPlay }) => {
  const [stats, setStats] = useState({ totalUploads: 0, totalPlays: 0 });
  const [history, setHistory] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [trackMap, setTrackMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(false); // pass false to avoid showing the loading spinner every time
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      // Fetch stats
      const statsResponse = await fetch('http://localhost:8080/api/v1/analytics/stats', {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`
        }
      });
      if (statsResponse.ok) {
        setStats(await statsResponse.json());
      }

      // Fetch history
      const historyResponse = await fetch('http://localhost:8080/api/v1/analytics/history', {
        headers: { 'Authorization': `Bearer ${keycloak.token}` }
      });
      let historyData = [];
      if (historyResponse.ok) {
        historyData = await historyResponse.json();
      }

      // Fetch top tracks
      const topTracksResponse = await fetch('http://localhost:8080/api/v1/analytics/top-tracks', {
        headers: { 'Authorization': `Bearer ${keycloak.token}` }
      });
      let topTracksData = [];
      if (topTracksResponse.ok) {
        topTracksData = await topTracksResponse.json();
      }

      // Fetch all tracks to map trackIds to metadata
      const tracksResponse = await api.get('/music/search');
      const map = {};
      tracksResponse.data.forEach(t => {
        map[t.id] = t;
      });
      
      setTrackMap(map);
      setHistory(historyData);
      setTopTracks(topTracksData);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const diff = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="w-full mt-4 lg:mt-8 pb-32 animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-4 text-slate-800 dark:text-slate-100">
          <Activity className="w-10 h-10 text-primary-500 p-2 bg-primary-100 dark:bg-primary-900/30 rounded-2xl shadow-sm" />
          Analytics Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg">Real-time statistics driven by our RabbitMQ event bus.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/60 dark:bg-slate-800/80 backdrop-blur-xl rounded-[2rem] p-8 border border-white dark:border-slate-700 relative overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500 cursor-default">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 via-white/0 dark:via-slate-800/0 to-primary-100/50 dark:to-primary-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 text-primary-500">
                <UploadCloud className="w-64 h-64" />
              </div>
              <div className="flex justify-between items-start mb-6">
                <div className="bg-primary-100 dark:bg-primary-900/30 p-4 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <UploadCloud className="w-8 h-8 text-primary-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-1">Total Uploads</h3>
              <p className="text-7xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">
                {stats.totalUploads}
              </p>
            </div>

            <div className="bg-white/60 dark:bg-slate-800/80 backdrop-blur-xl rounded-[2rem] p-8 border border-white dark:border-slate-700 relative overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500 cursor-default">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50/0 via-white/0 dark:via-slate-800/0 to-rose-100/50 dark:to-rose-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 text-rose-500">
                <PlayCircle className="w-64 h-64" />
              </div>
              <div className="flex justify-between items-start mb-6">
                <div className="bg-rose-100 dark:bg-rose-900/30 p-4 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <PlayCircle className="w-8 h-8 text-rose-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400 mb-1">Total Streams</h3>
              <p className="text-7xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">
                {stats.totalPlays}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
            {/* Top Tracks List (Takes 2/3 of space) */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                  <Disc3 className="w-7 h-7 text-primary-500" />
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Most Played Tracks</h2>
                </div>
              </div>

              {topTracks.length === 0 ? (
                <div className="bg-white/40 dark:bg-slate-800/60 backdrop-blur-md rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400 border border-white dark:border-slate-700 shadow-sm flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <PlayCircle className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                    <p className="text-lg font-medium">No tracks have been played yet.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 bg-white/40 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-slate-700 shadow-sm rounded-3xl p-4 lg:p-6 flex-1">
                  {/* Header Row */}
                  <div className="hidden md:flex items-center px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/50 mb-2">
                    <div className="w-12">#</div>
                    <div className="flex-1">Track</div>
                    <div className="w-32 text-right">Plays</div>
                  </div>
                  
                  {topTracks.map((item, index) => {
                    const track = trackMap[item.trackId];
                    if (!track) return null;

                    return (
                      <div 
                        key={`top-${item.trackId}`} 
                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-700/60 hover:shadow-md transition-all duration-300 group border border-transparent hover:border-slate-100 dark:hover:border-slate-600 cursor-pointer"
                        onClick={() => onPlay && onPlay(track, topTracks.map(t => trackMap[t.trackId]).filter(Boolean))}
                      >
                        <div className="w-8 text-center text-slate-400 font-bold text-lg group-hover:text-primary-500 transition-colors">
                          <span className="group-hover:hidden">{index + 1}</span>
                          <Play className="w-5 h-5 mx-auto hidden group-hover:block fill-current" />
                        </div>
                        <div className="flex-1 flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center flex-shrink-0 group-hover:from-primary-50 group-hover:to-primary-100 dark:group-hover:from-primary-900/40 dark:group-hover:to-primary-800/40 transition-colors shadow-inner">
                            <Disc3 className="w-6 h-6 text-slate-400 dark:text-slate-300 group-hover:text-primary-500 transition-colors" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-slate-800 dark:text-slate-100 font-bold text-base truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{track.title}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400 truncate">{track.artist}</span>
                          </div>
                        </div>
                        <div className="w-32 flex items-center justify-end gap-3">
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden hidden md:block">
                            <div 
                              className="h-full bg-primary-500 rounded-full" 
                              style={{ width: `${Math.max(5, (item.playCount / Math.max(...topTracks.map(t => t.playCount))) * 100)}%` }}
                            />
                          </div>
                          <span className="text-xl font-black text-slate-700 dark:text-slate-200 w-10 text-right">{item.playCount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Playback History List (Takes 1/3 of space) */}
            <div className="lg:col-span-1 flex flex-col">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                  <History className="w-6 h-6 text-rose-500" />
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Recent History</h2>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="bg-white/40 dark:bg-slate-800/60 backdrop-blur-md rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400 border border-white dark:border-slate-700 shadow-sm flex-1 flex items-center justify-center">
                  No playback history.
                </div>
              ) : (
                <div className="flex flex-col gap-1 bg-white/40 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-slate-700 shadow-sm rounded-3xl p-4 flex-1">
                  {history.map((item, index) => {
                    const track = trackMap[item.trackId];
                    if (!track) return null;

                    return (
                      <div 
                        key={`hist-${item.trackId}-${index}`} 
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-700/60 hover:shadow-sm transition-all group cursor-pointer"
                        onClick={() => onPlay && onPlay(track, history.map(t => trackMap[t.trackId]).filter(Boolean))}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 transition-colors">
                            <Play className="w-4 h-4 text-slate-400 dark:text-slate-300 group-hover:text-primary-500 fill-current opacity-0 group-hover:opacity-100 transition-opacity absolute" />
                            <History className="w-4 h-4 text-slate-400 dark:text-slate-300 group-hover:opacity-0 transition-opacity" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-slate-700 dark:text-slate-200 font-bold text-sm truncate group-hover:text-rose-500 transition-colors">{track.title}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{track.artist}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs flex-shrink-0 pl-3">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimeAgo(item.lastPlayed)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPanel;
