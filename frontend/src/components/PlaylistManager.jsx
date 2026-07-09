import React, { useState, useEffect } from 'react';
import { Play, Disc3, Clock, Trash2, Plus, ListMusic, ArrowLeft } from 'lucide-react';
import api from '../services/api';

const PlaylistManager = ({ onPlay }) => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const response = await api.get('/music/playlists');
      setPlaylists(response.data);
    } catch (err) {
      console.error("Failed to fetch playlists", err);
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    try {
      const response = await api.post('/music/playlists', { name: newPlaylistName });
      setPlaylists([...playlists, response.data]);
      setNewPlaylistName('');
      setIsCreating(false);
    } catch (err) {
      console.error("Failed to create playlist", err);
    }
  };

  const deletePlaylist = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/music/playlists/${id}`);
      setPlaylists(playlists.filter(p => p.id !== id));
      if (selectedPlaylist && selectedPlaylist.id === id) {
        setSelectedPlaylist(null);
      }
    } catch (err) {
      console.error("Failed to delete playlist", err);
    }
  };

  const viewPlaylist = async (id) => {
    try {
      const response = await api.get(`/music/playlists/${id}`);
      setSelectedPlaylist(response.data);
    } catch (err) {
      console.error("Failed to fetch playlist details", err);
    }
  };

  const removeTrackFromPlaylist = async (trackId, e) => {
    e.stopPropagation();
    if (!selectedPlaylist) return;
    try {
      await api.delete(`/music/playlists/${selectedPlaylist.id}/tracks/${trackId}`);
      setSelectedPlaylist({
        ...selectedPlaylist,
        tracks: selectedPlaylist.tracks.filter(t => t.id !== trackId)
      });
    } catch (err) {
      console.error("Failed to remove track from playlist", err);
    }
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

  // Single Playlist View
  if (selectedPlaylist) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedPlaylist(null)}
            className="p-2 bg-white hover:bg-slate-100 rounded-full text-slate-500 shadow-sm border border-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
            <ListMusic className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800">{selectedPlaylist.name}</h2>
            <p className="text-slate-500 font-medium">
              {selectedPlaylist.tracks?.length || 0} tracks
            </p>
          </div>
        </div>

        <div className="flex flex-col bg-white/60 backdrop-blur-xl border border-white shadow-sm rounded-3xl p-6 lg:p-8 relative z-10 mt-4">
          {(!selectedPlaylist.tracks || selectedPlaylist.tracks.length === 0) ? (
            <div className="text-center py-12">
              <ListMusic className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-slate-700">This playlist is empty</h3>
              <p className="text-slate-500">Add tracks from your library to fill it up!</p>
            </div>
          ) : (
            <>
              {/* Header row */}
              <div className="hidden md:flex items-center px-4 py-2 text-sm font-medium text-slate-500 border-b border-slate-200 mb-4">
                <div className="w-12 text-center">#</div>
                <div className="flex-1">Title</div>
                <div className="flex-1 hidden lg:block">Album</div>
                <div className="w-16 text-center">
                  <Clock className="w-4 h-4 mx-auto" />
                </div>
                <div className="w-16"></div>
              </div>

              {/* Track list */}
              <div className="flex flex-col gap-2">
                {selectedPlaylist.tracks.map((track, index) => (
                  <div 
                    key={track.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gradient-to-r hover:from-primary-50 hover:to-white transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:scale-[0.98] group cursor-pointer border border-transparent hover:border-primary-100"
                    onClick={() => onPlay(track)}
                  >
                    <div className="w-8 flex justify-center text-slate-500 group-hover:text-slate-800">
                      <span className="group-hover:hidden text-sm font-medium">{index + 1}</span>
                      <Play className="w-4 h-4 hidden group-hover:block fill-current" />
                    </div>
                    
                    <div className="flex-1 flex items-center gap-4 min-w-0">
                      <div className="relative w-10 h-10 rounded-md bg-gradient-to-br from-primary-600/50 to-primary-900/50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <Disc3 className="w-5 h-5 text-slate-800/50" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-base font-semibold text-slate-800 truncate">{track.title}</span>
                        <span className="text-sm text-slate-500 truncate">{track.artist}</span>
                      </div>
                    </div>

                    <div className="flex-1 hidden lg:block text-sm text-slate-500 truncate pr-4">
                      {track.album || '-'}
                    </div>

                    <div className="w-16 text-sm text-slate-500 text-center">
                      {formatDuration(track.duration)}
                    </div>

                    <div className="w-16 flex justify-end px-2">
                      <button 
                        onClick={(e) => removeTrackFromPlaylist(track.id, e)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove from Playlist"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Playlists Grid View
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
      {/* Create New Playlist Card */}
      {isCreating ? (
        <form 
          onSubmit={createPlaylist}
          className="flex flex-col items-center justify-center bg-white border-2 border-dashed border-primary-300 rounded-3xl p-6 aspect-square hover:border-primary-500 transition-colors shadow-sm"
        >
          <input
            type="text"
            autoFocus
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="Playlist Name..."
            className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4 font-semibold text-slate-700"
          />
          <div className="flex gap-2 w-full">
            <button 
              type="button" 
              onClick={() => setIsCreating(false)}
              className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2 bg-primary-500 text-white rounded-lg font-bold hover:bg-primary-600 transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      ) : (
        <button 
          onClick={() => setIsCreating(true)}
          className="flex flex-col items-center justify-center bg-primary-50/50 border-2 border-dashed border-primary-200 rounded-3xl p-6 aspect-square hover:bg-primary-50 hover:border-primary-400 transition-all active:scale-95 group"
        >
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
            <Plus className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="text-xl font-bold text-primary-700">New Playlist</h3>
        </button>
      )}

      {/* Playlist Cards */}
      {playlists.map(playlist => (
        <div 
          key={playlist.id}
          onClick={() => viewPlaylist(playlist.id)}
          className="group relative flex flex-col bg-white rounded-3xl p-6 aspect-square shadow-sm border border-slate-100 hover:shadow-xl hover:border-primary-200 transition-all duration-300 cursor-pointer hover:-translate-y-2 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button 
              onClick={(e) => deletePlaylist(playlist.id, e)}
              className="p-2 bg-white/90 backdrop-blur text-slate-400 hover:text-rose-500 rounded-full shadow-sm hover:shadow transition-all"
              title="Delete Playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center transform group-hover:scale-105 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
              <ListMusic className="w-12 h-12 text-primary-500 opacity-80" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800 truncate px-2">{playlist.name}</h3>
            <p className="text-sm text-slate-500 mt-1">
              {playlist.trackIds?.length || 0} tracks
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlaylistManager;
