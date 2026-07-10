import React, { useState, useEffect } from 'react';
import { Play, Disc3, Clock, Trash2, Plus, ListMusic, ArrowLeft } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';
import api from '../services/api';
import SortableTrackItem from './SortableTrackItem';
import SortablePlaylistCard from './SortablePlaylistCard';

const PlaylistManager = ({ onPlay }) => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id && selectedPlaylist) {
      const oldIndex = selectedPlaylist.tracks.findIndex(t => t.id === active.id);
      const newIndex = selectedPlaylist.tracks.findIndex(t => t.id === over.id);
      
      const newTracks = arrayMove(selectedPlaylist.tracks, oldIndex, newIndex);
      setSelectedPlaylist({ ...selectedPlaylist, tracks: newTracks });
    }
  };

  const handlePlaylistDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = playlists.findIndex(p => p.id === active.id);
      const newIndex = playlists.findIndex(p => p.id === over.id);
      setPlaylists(arrayMove(playlists, oldIndex, newIndex));
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
            className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
            <ListMusic className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedPlaylist.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {selectedPlaylist.tracks?.length || 0} tracks
            </p>
          </div>
        </div>

        <div className="flex flex-col bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white dark:border-slate-700 shadow-sm rounded-3xl p-6 lg:p-8 relative z-10 mt-4">
          {(!selectedPlaylist.tracks || selectedPlaylist.tracks.length === 0) ? (
            <div className="text-center py-12">
              <ListMusic className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">This playlist is empty</h3>
              <p className="text-slate-500 dark:text-slate-400">Add tracks from your library to fill it up!</p>
            </div>
          ) : (
            <>
              {/* Header row */}
              <div className="hidden md:flex items-center px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 mb-4">
                <div className="w-12 text-center">#</div>
                <div className="flex-1">Title</div>
                <div className="flex-1 hidden lg:block">Album</div>
                <div className="w-16 text-center">
                  <Clock className="w-4 h-4 mx-auto" />
                </div>
                <div className="w-16"></div>
              </div>

              {/* Track list */}
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={selectedPlaylist.tracks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-2">
                    {selectedPlaylist.tracks.map((track, index) => (
                      <SortableTrackItem 
                        key={track.id}
                        track={track}
                        index={index}
                        onPlay={(t) => onPlay(t, selectedPlaylist.tracks)}
                        onRemove={removeTrackFromPlaylist}
                        formatDuration={formatDuration}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
          className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 border-2 border-dashed border-primary-300 dark:border-primary-700 rounded-3xl p-6 aspect-square hover:border-primary-500 transition-colors shadow-sm"
        >
          <input
            type="text"
            autoFocus
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="Playlist Name..."
            className="w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4 font-semibold text-slate-700 dark:text-slate-200"
          />
          <div className="flex gap-2 w-full">
            <button 
              type="button" 
              onClick={() => setIsCreating(false)}
              className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
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
          className="flex flex-col items-center justify-center bg-primary-50/50 dark:bg-primary-900/10 border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-3xl p-6 aspect-square hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-400 transition-all active:scale-95 group"
        >
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
            <Plus className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="text-xl font-bold text-primary-700 dark:text-primary-400">New Playlist</h3>
        </button>
      )}

      {/* Playlist Cards */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handlePlaylistDragEnd}
      >
        <SortableContext 
          items={playlists.map(p => p.id)}
          strategy={rectSortingStrategy}
        >
          {playlists.map(playlist => (
            <SortablePlaylistCard 
              key={playlist.id}
              playlist={playlist}
              onView={viewPlaylist}
              onDelete={deletePlaylist}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default PlaylistManager;
