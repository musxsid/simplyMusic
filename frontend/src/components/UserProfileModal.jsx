import React from 'react';
import { X, User, Mail, ShieldCheck, Camera } from 'lucide-react';

const UserProfileModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  const username = user?.preferred_username || 'User';
  const name = user?.name || username;
  const email = user?.email || 'No email provided';
  const userId = user?.sub || 'Unknown ID';
  const emailVerified = user?.email_verified;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Background */}
        <div className="h-32 bg-gradient-to-r from-primary-500 to-rose-500 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-8 pb-8 relative">
          {/* Avatar */}
          <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full p-2 absolute -top-12 left-8 shadow-xl group cursor-pointer">
            <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center border-2 border-primary-100 dark:border-primary-800/50 relative overflow-hidden transition-all">
              <span className="font-extrabold text-4xl group-hover:opacity-10 transition-opacity">{name.charAt(0).toUpperCase()}</span>
              
              {/* Upload Overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
              Upload Image
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white truncate">{name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-primary-500 dark:text-primary-400 font-medium">@{username}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Tenant</span>
            </div>
          </div>

          <div class="mt-8 space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{email}</span>
              </div>
              {emailVerified && (
                <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" title="Email Verified" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
