import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Check, Disc3, Loader2 } from 'lucide-react';
import api from '../services/api';

const AddSongsModal = ({ playlist, onClose, onTrackAdded }) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [addingTrackId, setAddingTrackId] = useState(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/music/search');
      setTracks(response.data);
    } catch (err) {
      console.error("Failed to fetch tracks", err);
    } finally {
      setLoading(false);
    }
  };

  const addTrack = async (track) => {
    setAddingTrackId(track.id);
    try {
      await api.post(`/music/playlists/${playlist.id}/tracks/${track.id}`);
      const fullPlaylist = await api.get(`/music/playlists/${playlist.id}`);
      onTrackAdded(fullPlaylist.data);
      onClose();
    } catch (err) {
      console.error("Failed to add track to playlist", err);
    } finally {
      setAddingTrackId(null);
    }
  };

  const playlistTrackIds = new Set(playlist.tracks?.map(t => t.id) || []);
  const filteredTracks = tracks.filter(t => 
    (t.title.toLowerCase().includes(query.toLowerCase()) || 
     t.artist?.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Add Songs to Playlist</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            placeholder="Search your library..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px] custom-scrollbar pr-2">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : filteredTracks.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Disc3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tracks found in your library.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredTracks.map(track => {
                const isAdded = playlistTrackIds.has(track.id);
                const isAdding = addingTrackId === track.id;

                return (
                  <div key={track.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 group transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Disc3 className="w-6 h-6 text-primary-500" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate">{track.title}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400 truncate">{track.artist}</span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 ml-4">
                      {isAdded ? (
                        <button disabled className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg font-bold text-sm">
                          <Check className="w-4 h-4" /> Added
                        </button>
                      ) : (
                        <button 
                          onClick={() => addTrack(track)}
                          disabled={isAdding}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-primary-500 hover:text-white text-slate-700 dark:text-slate-200 rounded-lg font-bold text-sm transition-colors group-hover:bg-primary-500 group-hover:text-white"
                        >
                          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddSongsModal;
