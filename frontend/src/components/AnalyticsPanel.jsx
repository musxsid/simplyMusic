import React, { useState, useEffect } from 'react';
import { Activity, UploadCloud, PlayCircle, History, Clock, Disc3 } from 'lucide-react';
import keycloak from '../keycloak';
import api from '../services/api';

const AnalyticsPanel = () => {
  const [stats, setStats] = useState({ totalUploads: 0, totalPlays: 0 });
  const [history, setHistory] = useState([]);
  const [trackMap, setTrackMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch stats
      const statsResponse = await fetch('http://localhost:8082/api/v1/analytics/stats', {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`
        }
      });
      if (statsResponse.ok) {
        setStats(await statsResponse.json());
      }

      // Fetch history
      const historyResponse = await fetch('http://localhost:8082/api/v1/analytics/history', {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`
        }
      });
      let historyData = [];
      if (historyResponse.ok) {
        historyData = await historyResponse.json();
      }

      // Fetch all tracks to map trackIds to metadata
      const tracksResponse = await api.get('/music/search');
      const map = {};
      tracksResponse.data.forEach(t => {
        map[t.id] = t;
      });
      
      setTrackMap(map);
      setHistory(historyData);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
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
    <div className="max-w-4xl mx-auto mt-10 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary-400" />
          Analytics Dashboard
        </h1>
        <p className="text-dark-muted mt-2">Real-time statistics driven by our RabbitMQ event bus.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                <UploadCloud className="w-48 h-48" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary-500/20 p-3 rounded-xl">
                  <UploadCloud className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Total Uploads</h3>
              </div>
              <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-200 to-primary-600">
                {stats.totalUploads}
              </p>
            </div>

            <div className="glass rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                <PlayCircle className="w-48 h-48" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary-500/20 p-3 rounded-xl">
                  <PlayCircle className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Total Streams</h3>
              </div>
              <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-200 to-primary-600">
                {stats.totalPlays}
              </p>
            </div>
          </div>

          {/* Playback History List */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <History className="w-6 h-6 text-primary-400" />
              <h2 className="text-2xl font-bold text-white">Top Tracks & History</h2>
            </div>

            {history.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-dark-muted border border-white/5">
                No playback history available.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map((item, index) => {
                  const track = trackMap[item.trackId];
                  if (!track) return null; // Track might have been deleted

                  return (
                    <div key={item.trackId} className="glass rounded-2xl p-4 flex items-center justify-between border border-white/5 hover:border-primary-500/30 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className="w-8 text-center text-dark-muted font-bold">
                          #{index + 1}
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-600/50 to-primary-900/50 flex items-center justify-center flex-shrink-0">
                          <Disc3 className="w-6 h-6 text-white/50" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{track.title}</span>
                          <span className="text-sm text-dark-muted">{track.artist}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 pr-4">
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-dark-muted uppercase tracking-wider font-semibold">Total Plays</span>
                          <span className="text-xl font-black text-primary-300">{item.playCount}</span>
                        </div>
                        <div className="flex items-center gap-2 text-dark-muted text-sm min-w-[100px] justify-end">
                          <Clock className="w-4 h-4" />
                          {formatTimeAgo(item.lastPlayed)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPanel;
