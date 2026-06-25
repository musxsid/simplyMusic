import React, { useState, useEffect } from 'react';
import keycloak from '../keycloak'; // Import your initialized Keycloak instance
import { User, Mail } from 'lucide-react'; // Your Lucide icons

const UserProfile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Only fetch if the user is actively authenticated
    if (keycloak.authenticated) {
      keycloak.loadUserProfile()
        .then((userProfile) => {
          setProfile(userProfile);
        })
        .catch((err) => {
          console.error("Failed to load user profile", err);
        });
    }
  }, []);

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="glass p-6 rounded-3xl w-80">
      <div className="flex items-center space-x-4 mb-4">
        <div className="bg-primary-100 p-3 rounded-full shadow-glow-primary">
           <User className="text-primary-500 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {profile.firstName} {profile.lastName}
          </h2>
          <span className="text-sm text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
            @{profile.username}
          </span>
        </div>
      </div>
      
      <div className="flex items-center text-slate-500 mt-4 space-x-2">
        <Mail className="w-4 h-4" />
        <span className="text-sm">{profile.email}</span>
      </div>
      
      <button 
        onClick={() => keycloak.logout()}
        className="mt-6 w-full bg-rose-950/30 text-rose-500 py-2 rounded-md hover:bg-rose-900/50 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
};

export default UserProfile;