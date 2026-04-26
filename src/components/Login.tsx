import React from 'react';
import { Logo } from './Logo';

export const Login: React.FC<{ onBack: () => void, onLogin: () => void, onGoToSignup: () => void, onGoHome: () => void }> = ({ onBack, onLogin, onGoToSignup, onGoHome }) => {
  return (
    <div className="bg-surface-muted min-h-screen flex flex-col font-body-md text-on-surface antialiased selection:bg-primary-fixed-dim selection:text-primary overflow-hidden">
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
        {/* Decorative Background Blob */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-surface-variant rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-secondary-fixed-dim rounded-full mix-blend-multiply filter blur-3xl opacity-20 z-0"></div>
        
        <div className="max-w-md w-full space-y-8 z-10">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <button 
                onClick={onGoHome}
                className="focus:outline-none"
              >
                <div className="bg-primary p-4 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
                  <Logo variant="light" showText={false} iconSize="text-4xl" />
                </div>
              </button>
            </div>
            <button 
              onClick={onGoHome}
              className="mt-2 focus:outline-none block w-full text-center"
            >
              <Logo className="justify-center" textSize="text-3xl" showIcon={false} />
            </button>
            <p className="mt-2 text-body-lg font-body-lg text-on-surface-variant">Sign in to your account</p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-primary-container"></div>
            <div className="p-8">
              <form className="space-y-stack-md" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
                <div>
                  <label className="block text-label-caps font-label-caps text-on-surface mb-stack-sm uppercase text-opacity-80" htmlFor="email">Email Address</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-xl">mail</span>
                    </div>
                    <input autoFocus className="block w-full pl-10 bg-surface border border-outline-variant rounded-lg py-3 text-body-md font-body-md text-on-surface placeholder-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors" id="email" placeholder="you@example.com" required type="email"/>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-stack-sm">
                    <label className="block text-label-caps font-label-caps text-on-surface uppercase text-opacity-80" htmlFor="password">Password</label>
                    <div className="text-sm">
                      <a className="font-body-md text-body-md text-secondary hover:text-on-secondary-container transition-colors" href="#">Forgot Password?</a>
                    </div>
                  </div>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-xl">lock</span>
                    </div>
                    <input className="block w-full pl-10 bg-surface border border-outline-variant rounded-lg py-3 text-body-md font-body-md text-on-surface placeholder-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors" id="password" placeholder="••••••••" required type="password"/>
                  </div>
                </div>
                <div>
                  <button className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-body-md font-body-md font-semibold text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors" type="submit">
                    Sign In
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </form>
              <div className="mt-6 text-center">
                <p className="text-body-md font-body-md text-on-surface-variant">
                  Don't have an account? <button onClick={onGoToSignup} className="font-body-md text-body-md font-semibold text-primary hover:text-primary-container transition-colors">Sign up instead</button>
                </p>
                <button onClick={onBack} className="mt-4 text-sm text-slate-500 hover:text-slate-700">Back to Home</button>
              </div>
            </div>
            <div className="bg-surface-container-low px-8 py-4 border-t border-outline-variant">
              <div className="flex items-center justify-center gap-2 text-on-tertiary-container">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                <span className="text-label-caps font-label-caps">Secure Login powered by Auth0</span>
              </div>
            </div>
          </div>
        </div>
      </main>

  <footer className="w-full border-t border-outline-variant mt-auto bg-surface-container-lowest text-on-surface py-12 px-6 z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <Logo />
          <div className="flex flex-col md:flex-row items-center gap-8">
            <nav className="flex gap-6">

            </nav>
            <div className="text-outline text-xs border-l border-outline-variant pl-8 hidden md:block">
              © Pacific LegalMaps. <br/>Washington State Legal Services.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
