import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import api from './services/api';
import { AudioPipelineProvider } from './context/AudioPipelineContext';

const Main = () => {
  const [user, setUser] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    api.get('/user')
      .then(response => {
        if (response.data && response.data.preferred_username) {
          setUser(response.data);
          setInitialized(true);
        } else {
          window.location.href = 'http://localhost:8080/oauth2/authorization/keycloak';
        }
      })
      .catch(error => {
        console.error("Authentication check failed", error);
        window.location.href = 'http://localhost:8080/oauth2/authorization/keycloak';
      });
  }, []);

  if (!initialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-primary-500">
        <div className="animate-pulse text-2xl font-bold tracking-widest">
          INITIALIZING...
        </div>
      </div>
    );
  }

  if (initialized && !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-rose-500">
        <div className="text-xl">Authentication Failed. Please reload.</div>
      </div>
    );
  }

  return (
    <AudioPipelineProvider>
      <App user={user} />
    </AudioPipelineProvider>
  );
};

// React.StrictMode has been removed below!
ReactDOM.createRoot(document.getElementById('root')).render(
    <Main />
);