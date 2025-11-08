import React, { createContext, useState, useContext, useEffect } from 'react';
import { loadUserProfile } from '../utils/localStorage';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeCall, setActiveCall] = useState(null); // { callId, otherUserId, type }

  useEffect(() => {
    const userProfile = loadUserProfile();
    if (userProfile) {
      setCurrentUser(userProfile);
    }
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, activeCall, setActiveCall }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
