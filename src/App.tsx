/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider } from './lib/auth';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { useAuth } from './lib/auth';
import { Login } from './components/Login';
import { Signup } from './components/Signup';

type AppView = 'landing' | 'login' | 'signup' | 'dashboard';

const AppContent = () => {
  const { isAuthenticated, isLoading, login, signup, logout } = useAuth();
  const [isGuest, setIsGuest] = React.useState(false);
  const [view, setView] = React.useState<AppView>('landing');

  React.useEffect(() => {
    if (isAuthenticated) {
      setView('dashboard');
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleGuestEntry = () => {
    setIsGuest(true);
    setView('dashboard');
  };

  const handleLogout = () => {
    logout();
    setIsGuest(true);
    setView('dashboard');
  };

  if (view === 'landing') {
    return <LandingPage onGuestEntry={handleGuestEntry} onGoToLogin={() => setView('login')} />;
  }

  if (view === 'login') {
    return (
      <Login 
        onBack={() => setView('landing')} 
        onLogin={() => login()} 
        onGoToSignup={() => setView('signup')} 
        onGoHome={() => {
          setView('landing');
          setIsGuest(false);
        }}
      />
    );
  }

  if (view === 'signup') {
    return (
      <Signup 
        onBack={() => setView('login')} 
        onSignup={() => signup()} 
        onGoHome={() => {
          setView('landing');
          setIsGuest(false);
        }}
      />
    );
  }

  if (isAuthenticated || isGuest || view === 'dashboard') {
    return (
      <Dashboard 
        isGuest={!isAuthenticated && isGuest} 
        isAuthenticated={isAuthenticated}
        onLogin={() => setView('login')}
        onLogout={handleLogout}
        onGoHome={() => {
          setView('landing');
          setIsGuest(false);
        }} 
      />
    );
  }

  return <LandingPage onGuestEntry={handleGuestEntry} onGoToLogin={() => setView('login')} />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
