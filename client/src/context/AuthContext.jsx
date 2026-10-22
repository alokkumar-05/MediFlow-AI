import React, { createContext, useContext, useState } from 'react';

// Phase 2 will introduce full JWT auth, login, logout, and role inspection
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Phase 1 scaffold state
  const [user, setUser] = useState({
    name: 'Admin Staff',
    role: 'admin',
    email: 'admin@mediflow.local'
  });

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated: true }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
