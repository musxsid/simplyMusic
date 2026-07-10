import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ListMusic, Trash2, GripHorizontal } from 'lucide-react';

const SortablePlaylistCard = ({ playlist, onView, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: playlist.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col bg-white dark:bg-slate-800 rounded-3xl p-6 aspect-square shadow-sm border ${isDragging ? 'border-primary-500 scale-[1.02] shadow-xl z-50' : 'border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-800 hover:-translate-y-2'} transition-all duration-300 overflow-hidden`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
        <button 
          onClick={(e) => onDelete(playlist.id, e)}
          className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 rounded-full shadow-sm hover:shadow transition-all"
          title="Delete Playlist"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div 
        className="absolute top-0 left-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-grab active:cursor-grabbing"
        {...attributes} 
        {...listeners}
      >
        <div className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur text-slate-400 dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 rounded-full shadow-sm hover:shadow transition-all">
          <GripHorizontal className="w-4 h-4" />
        </div>
      </div>

      <div 
        className="flex-1 flex items-center justify-center mb-4 cursor-pointer"
        onClick={() => { if (!isDragging) onView(playlist.id); }}
      >
        <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center transform group-hover:scale-105 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
          <ListMusic className="w-12 h-12 text-primary-500 opacity-80" />
        </div>
      </div>
      <div className="text-center cursor-pointer" onClick={() => { if (!isDragging) onView(playlist.id); }}>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate px-2">{playlist.name}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {playlist.trackIds?.length || 0} tracks
        </p>
      </div>
    </div>
  );
};

export default SortablePlaylistCard;
