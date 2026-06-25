import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import keycloak from './keycloak';

const Main = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    keycloak.init({ onLoad: 'login-required', checkLoginIframe: false })
      .then(auth => {
        setAuthenticated(auth);
        setInitialized(true);
      })
      .catch(console.error);
  }, []);

  if (!initialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-dark-bg text-primary-400">
        <div className="animate-pulse text-2xl font-bold tracking-widest">
          INITIALIZING...
        </div>
      </div>
    );
  }

  if (initialized && !authenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-dark-bg text-red-400">
        <div className="text-xl">Authentication Failed. Please reload.</div>
      </div>
    );
  }

  return <App />;
};

// React.StrictMode has been removed below!
ReactDOM.createRoot(document.getElementById('root')).render(
    <Main />
);