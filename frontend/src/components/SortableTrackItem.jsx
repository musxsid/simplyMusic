import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, Disc3, Clock, Trash2, GripVertical } from 'lucide-react';

const SortableTrackItem = ({ track, index, onPlay, onRemove, formatDuration }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

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
      className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 border ${isDragging ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 shadow-xl scale-[1.02] z-50' : 'hover:bg-gradient-to-r hover:from-primary-50 hover:to-white dark:hover:from-slate-700/50 dark:hover:to-slate-700 hover:shadow-md hover:-translate-y-1 active:scale-[0.98] group cursor-pointer border-transparent hover:border-primary-100 dark:hover:border-slate-600 relative'}`}
      onClick={(e) => {
        // Prevent click if we are dragging
        if (isDragging) return;
        onPlay(track);
      }}
    >
      <div 
        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary-500 dark:text-slate-500 dark:hover:text-primary-400 bg-slate-100/50 hover:bg-slate-200/80 dark:bg-slate-800/50 dark:hover:bg-slate-700 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
        {...attributes} 
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        title="Drag to reorder"
      >
        <GripVertical className="w-6 h-6" />
      </div>
      
      <div className="w-8 flex justify-center text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200">
        <span className="group-hover:hidden text-sm font-medium">{index + 1}</span>
        <Play className="w-4 h-4 hidden group-hover:block fill-current" />
      </div>
      
      <div className="flex-1 flex items-center gap-4 min-w-0">
        <div className="relative w-10 h-10 rounded-md bg-gradient-to-br from-primary-600/50 to-primary-900/50 flex-shrink-0 flex items-center justify-center overflow-hidden">
          <Disc3 className="w-5 h-5 text-slate-800/50 dark:text-slate-100/50" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">{track.title}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400 truncate">{track.artist}</span>
        </div>
      </div>

      <div className="flex-1 hidden lg:block text-sm text-slate-500 dark:text-slate-400 truncate pr-4">
        {track.album || '-'}
      </div>

      <div className="w-16 text-sm text-slate-500 dark:text-slate-400 text-center">
        {formatDuration(track.duration)}
      </div>

      <div className="w-16 flex justify-end px-2">
        <button 
          onClick={(e) => onRemove(track.id, e)}
          className="text-slate-400 hover:text-rose-600 transition-colors z-10 relative"
          title="Remove from Playlist"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SortableTrackItem;
