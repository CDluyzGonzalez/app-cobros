import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, clearSessionToken, getSessionToken, setSessionToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('APP_COBROS_USER');
    return saved && getSessionToken() ? JSON.parse(saved) : null;
  });

  const login = async (email: string, pass: string) => {
    const loggedUser = await api.login(email, pass);
    setSessionToken(loggedUser.token || '');
    const { token: _token, ...safeUser } = loggedUser;
    setUser(safeUser as User);
    localStorage.setItem('APP_COBROS_USER', JSON.stringify(safeUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('APP_COBROS_USER');
    clearSessionToken();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return ctx;
};
