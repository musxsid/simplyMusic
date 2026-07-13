import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, Trash2 } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', title = null, duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, title }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-24 sm:top-20 right-4 sm:right-8 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      case 'error': return <AlertCircle className="w-6 h-6 text-rose-500" />;
      case 'removed': return <Trash2 className="w-6 h-6 text-slate-500" />;
      default: return <Info className="w-6 h-6 text-primary-500" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success': return 'border-l-emerald-500';
      case 'error': return 'border-l-rose-500';
      case 'removed': return 'border-l-slate-500';
      default: return 'border-l-primary-500';
    }
  };

  return (
    <div className={`pointer-events-auto flex items-start gap-4 p-4 rounded-2xl bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl border border-white/60 dark:border-slate-700 shadow-xl min-w-[300px] max-w-sm animate-in slide-in-from-right-8 fade-in duration-300 border-l-4 ${getBorderColor()}`}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{toast.title || (toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : toast.type === 'removed' ? 'Removed' : 'Notification')}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{toast.message}</p>
      </div>
      <button onClick={onRemove} className="flex-shrink-0 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
