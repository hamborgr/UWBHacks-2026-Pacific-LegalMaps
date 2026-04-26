import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: () => Promise<void>;
  signup: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USER = {
  name: 'Demo User',
  email: 'demo@pacificlegalmaps.com',
  picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  sub: 'mock|123'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Check local storage for persistent mock session
      const saved = localStorage.getItem('mock_auth');
      if (saved === 'true') {
        setIsAuthenticated(true);
        setUser(MOCK_USER);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login: async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsAuthenticated(true);
      setUser(MOCK_USER);
      setIsLoading(false);
      localStorage.setItem('mock_auth', 'true');
    },
    signup: async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsAuthenticated(true);
      setUser(MOCK_USER);
      setIsLoading(false);
      localStorage.setItem('mock_auth', 'true');
    },
    logout: () => {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('mock_auth');
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
