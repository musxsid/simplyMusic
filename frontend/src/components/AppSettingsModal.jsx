import React from 'react';
import { createPortal } from 'react-dom';
import { X, Moon, Sun, Bell, Volume2, Shield, Info } from 'lucide-react';
import EQSettings from './EQSettings';

const AppSettingsModal = ({ isOpen, onClose, isDarkMode, toggleDarkMode }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] bg-white/40 dark:bg-slate-900/60 backdrop-blur-3xl flex items-center justify-center p-4">
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden flex flex-col animate-jelly-popup relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">App Settings</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] flex flex-col gap-6">
          
          {/* Appearance Section */}
          <div>
            <h3 className="text-sm font-bold text-primary-500 uppercase tracking-wider mb-3">Appearance</h3>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-500">
                    {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">Dark Mode</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Toggle dark or light theme</p>
                  </div>
                </div>
                <button 
                  onClick={toggleDarkMode}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isDarkMode ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Preferences Section (Dummy) */}
          <div>
            <h3 className="text-sm font-bold text-primary-500 uppercase tracking-wider mb-3">Preferences</h3>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-500">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">Audio Quality</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Set streaming quality</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-primary-500">High</span>
              </div>
              <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg text-amber-500">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">Notifications</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Manage alerts and emails</p>
                  </div>
                </div>
                <button className="w-12 h-6 rounded-full transition-colors relative bg-primary-500">
                  <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform left-7" />
                </button>
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-200 dark:bg-slate-700 p-2 rounded-lg text-slate-600 dark:text-slate-300">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">Privacy & Security</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Manage account privacy</p>
                  </div>
                </div>
                <button className="text-primary-500 text-sm font-bold">Manage</button>
              </div>
            </div>
          </div>

          {/* Audio Section */}
          <div>
            <h3 className="text-sm font-bold text-primary-500 uppercase tracking-wider mb-3">Audio Pipeline</h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50 mb-4">
              <EQSettings />
            </div>
          </div>

          {/* About Section */}
          <div>
            <h3 className="text-sm font-bold text-primary-500 uppercase tracking-wider mb-3">About</h3>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50 group hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-100 dark:bg-cyan-900/30 p-2 rounded-lg text-cyan-500">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">Version Info</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">simplyMusic v1.0.0</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AppSettingsModal;
