// contexts/SyncContext.js
import React, { createContext, useContext, useState } from 'react';

const SyncContext = createContext();

export const SyncProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <SyncContext.Provider value={{
      refreshTrigger,
      triggerRefresh,
      syncing,
      setSyncing
    }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};