import React, { useState, useEffect } from 'react';
import { Search, Play, Disc3, Clock, Calendar, Heart, Trash2 } from 'lucide-react';
import api from '../services/api';
import VoiceSearch from './VoiceSearch';
import keycloak from '../keycloak';

const MusicExplorer = ({ onPlay }) => {
  const [tracks, setTracks] = useState([]);
  const [favourites, setFavourites] = useState(new Set());
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [voiceMatch, setVoiceMatch] = useState(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTracks(query);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  useEffect(() => {
    fetchFavourites();
  }, []);

  const fetchFavourites = async () => {
    try {
      const response = await api.get('/music/favourites');
      setFavourites(new Set(response.data.map(t => t.id)));
    } catch (err) {
      console.error("Failed to fetch favourites", err);
    }
  };

  const fetchTracks = async (searchQuery = '') => {
    setLoading(true);
    try {
      const response = await api.get(`/music/search${searchQuery ? `?query=${searchQuery}` : ''}`);
      setTracks(response.data);
    } catch (err) {
      console.error("Failed to fetch tracks", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTracks(query);
  };

  const toggleFavourite = async (e, trackId) => {
    e.stopPropagation();
    try {
      if (favourites.has(trackId)) {
        await api.delete(`/music/${trackId}/favourite`);
        const nextFavs = new Set(favourites);
        nextFavs.delete(trackId);
        setFavourites(nextFavs);
      } else {
        await api.post(`/music/${trackId}/favourite`);
        const nextFavs = new Set(favourites);
        nextFavs.add(trackId);
        setFavourites(nextFavs);
      }
    } catch (err) {
      console.error("Failed to toggle favourite", err);
    }
  };

  const deleteTrack = async (e, trackId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this track?")) {
      try {
        await api.delete(`/music/${trackId}`);
        setTracks(tracks.filter(t => t.id !== trackId));
        const nextFavs = new Set(favourites);
        nextFavs.delete(trackId);
        setFavourites(nextFavs);
      } catch (err) {
        console.error("Failed to delete track", err);
      }
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Your Library</h1>
          <p className="text-dark-muted mt-2">Explore and play your uploaded tracks.</p>
        </div>
        
        <form onSubmit={handleSearch} className="relative w-full md:w-96 flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-dark-muted" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-3 bg-dark-bg border border-white/10 rounded-full text-white placeholder-dark-muted focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-inner"
              placeholder="Search by title, artist, or album..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <VoiceSearch onMatch={setVoiceMatch} />
        </form>
      </div>

      {/* Voice Match Pop-up */}
      {voiceMatch && (
        <div className="bg-primary-900/30 border border-primary-500/50 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-6 animate-in fade-in zoom-in">
          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
            <img src={voiceMatch.coverArtUrl} alt="Cover" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-primary-400 tracking-widest uppercase mb-1">Song Identified</h3>
            <h2 className="text-2xl font-black text-white">{voiceMatch.title}</h2>
            <p className="text-dark-muted">{voiceMatch.artist} &bull; {voiceMatch.album}</p>
            <div className="mt-3 text-xs flex gap-3 justify-center sm:justify-start">
              <span className="bg-dark-bg px-2 py-1 rounded border border-white/10">{voiceMatch.genre}</span>
              <span className="bg-dark-bg px-2 py-1 rounded border border-white/10">{voiceMatch.releaseYear}</span>
              <span className="text-green-400 font-medium px-2 py-1">{Math.round(voiceMatch.confidence * 100)}% Match</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => {
                setQuery(voiceMatch.title);
                fetchTracks(voiceMatch.title);
                setVoiceMatch(null);
              }}
              className="bg-primary-500 hover:bg-primary-400 text-dark-bg font-bold py-2 px-6 rounded-full transition-transform active:scale-95 whitespace-nowrap"
            >
              Search Library
            </button>
            <button 
              onClick={() => setVoiceMatch(null)}
              className="text-dark-muted hover:text-white text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : tracks.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center">
          <Disc3 className="w-16 h-16 text-dark-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-2xl font-bold mb-2">No tracks found</h3>
          <p className="text-dark-muted">Upload some music to get started!</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Header row */}
          <div className="hidden md:flex items-center px-4 py-2 text-sm font-medium text-dark-muted border-b border-white/10 mb-4">
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
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 group cursor-pointer border border-transparent hover:border-white/5"
                onClick={() => onPlay(track)}
              >
                {/* Index / Play Button */}
                <div className="w-8 flex justify-center text-dark-muted group-hover:text-white">
                  <span className="group-hover:hidden text-sm font-medium">{index + 1}</span>
                  <Play className="w-4 h-4 hidden group-hover:block fill-current" />
                </div>
                
                {/* Title and Artist */}
                <div className="flex-1 flex items-center gap-4 min-w-0">
                  <div className="relative w-12 h-12 rounded-md bg-gradient-to-br from-primary-600/50 to-primary-900/50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <Disc3 className="w-6 h-6 text-white/50" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-base font-semibold text-white truncate">{track.title}</span>
                    <span className="text-sm text-dark-muted truncate">{track.artist}</span>
                  </div>
                </div>

                {/* Album */}
                <div className="flex-1 hidden lg:block text-sm text-dark-muted truncate pr-4">
                  {track.album || '-'}
                </div>

                {/* Date Added */}
                <div className="w-32 hidden xl:block text-sm text-dark-muted">
                  {track.createdAt ? new Date(track.createdAt).toLocaleDateString() : '-'}
                </div>

                {/* Duration */}
                <div className="w-16 text-sm text-dark-muted text-center">
                  {formatDuration(track.duration)}
                </div>

                {/* Actions */}
                <div className="w-24 flex items-center justify-end gap-3 px-2">
                  <button 
                    onClick={(e) => toggleFavourite(e, track.id)}
                    className="text-dark-muted hover:text-red-400 transition-colors"
                  >
                    <Heart className={`w-5 h-5 ${favourites.has(track.id) ? 'fill-red-400 text-red-400' : ''}`} />
                  </button>
                  {track.uploadedBy === keycloak.tokenParsed?.sub && (
                    <button 
                      onClick={(e) => deleteTrack(e, track.id)}
                      className="text-dark-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Track"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicExplorer;
