import React, { useState, useEffect } from 'react';
import { Play, Disc3, Clock, Calendar, Heart, HeartCrack } from 'lucide-react';
import api from '../services/api';
import keycloak from '../keycloak';

const Favourites = ({ onPlay }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavourites();
  }, []);

  const fetchFavourites = async () => {
    setLoading(true);
    try {
      const response = await api.get('/music/favourites');
      setTracks(response.data);
    } catch (err) {
      console.error("Failed to fetch favourites", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavourite = async (e, trackId) => {
    e.stopPropagation();
    try {
      await api.delete(`/music/${trackId}/favourite`);
      setTracks(tracks.filter(t => t.id !== trackId));
    } catch (err) {
      console.error("Failed to remove favourite", err);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
          <Heart className="w-10 h-10 text-rose-600 fill-rose-600" />
          Your Favourites
        </h1>
        <p className="text-slate-500">The tracks you love the most.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : tracks.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center">
          <HeartCrack className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-2xl font-bold mb-2">No favourites yet</h3>
          <p className="text-slate-500">Go to your library and heart some tracks!</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Header row */}
          <div className="hidden md:flex items-center px-4 py-2 text-sm font-medium text-slate-500 border-b border-slate-200 mb-4">
            <div className="w-12 text-center">#</div>
            <div className="flex-1">Title</div>
            <div className="flex-1 hidden lg:block">Album</div>
            <div className="w-32 hidden xl:block">Date Added</div>
            <div className="w-16 text-center">
              <Clock className="w-4 h-4 mx-auto" />
            </div>
            <div className="w-24"></div>
          </div>

          {/* Track list */}
          <div className="flex flex-col gap-2">
            {tracks.map((track, index) => (
              <div 
                key={track.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-200 transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.99] group cursor-pointer border border-transparent"
                onClick={() => onPlay(track)}
              >
                {/* Index / Play Button */}
                <div className="w-8 flex justify-center text-slate-500 group-hover:text-slate-800">
                  <span className="group-hover:hidden text-sm font-medium">{index + 1}</span>
                  <Play className="w-4 h-4 hidden group-hover:block fill-current" />
                </div>
                
                {/* Title and Artist */}
                <div className="flex-1 flex items-center gap-4 min-w-0">
                  <div className="relative w-12 h-12 rounded-md bg-gradient-to-br from-primary-600/50 to-primary-900/50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <Disc3 className="w-6 h-6 text-slate-800/50" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-base font-semibold text-slate-800 truncate">{track.title}</span>
                    <span className="text-sm text-slate-500 truncate">{track.artist}</span>
                  </div>
                </div>

                {/* Album */}
                <div className="flex-1 hidden lg:block text-sm text-slate-500 truncate pr-4">
                  {track.album || '-'}
                </div>

                {/* Date Added */}
                <div className="w-32 hidden xl:block text-sm text-slate-500">
                  {track.createdAt ? new Date(track.createdAt).toLocaleDateString() : '-'}
                </div>

                {/* Duration */}
                <div className="w-16 text-sm text-slate-500 text-center">
                  {formatDuration(track.duration)}
                </div>

                {/* Actions */}
                <div className="w-24 flex items-center justify-end gap-3 px-2">
                  <button 
                    onClick={(e) => removeFavourite(e, track.id)}
                    className="text-rose-500 hover:text-slate-800 transition-colors"
                    title="Remove from Favourites"
                  >
                    <Heart className="w-5 h-5 fill-rose-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Favourites;
