import React from 'react';

import { Logo } from './Logo';

export const LandingPage: React.FC<{ onGuestEntry: () => void, onGoToLogin: () => void }> = ({ onGuestEntry, onGoToLogin }) => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  return (
    <div className="bg-surface-muted text-on-surface font-body-md antialiased flex flex-col min-h-screen">
      {/* TopNavBar */}
      <header className="bg-primary text-white font-sans antialiased top-0 sticky z-50 border-b border-primary-container shadow-md hidden md:block">
        <div className="flex justify-between items-center h-16 px-6 md:px-12 max-w-[1200px] mx-auto w-full">
          <button 
            onClick={scrollToTop}
            className="focus:outline-none"
          >
            <Logo variant="light" />
          </button>
          <nav className="hidden md:flex gap-8">
          </nav>
          <div className="flex items-center gap-4">
            <button 
              onClick={onGuestEntry}
              className="text-primary-fixed border border-primary-fixed/30 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-semibold"
            >
              Guest Entry
            </button>
            <button 
              onClick={onGoToLogin}
              className="bg-primary-fixed text-primary px-6 py-2 rounded-lg hover:bg-white transition-colors font-semibold shadow-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Header (Simplified for Landing) */}
      <header className="md:hidden bg-primary text-white border-b border-primary-container flex justify-between items-center h-16 px-6 sticky top-0 z-50 shadow-md">
        <button 
          onClick={scrollToTop}
          className="focus:outline-none"
        >
          <Logo variant="light" textSize="text-lg" />
        </button>
        <button className="text-white">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </header>

      <main className="flex-grow flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-container-max mx-auto px-6 md:px-12 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high text-on-primary-fixed-variant rounded-full font-label-caps text-label-caps mb-4">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              Serving Washington State Residents
            </div>
            <h1 className="font-h1 text-h1 text-primary">Locate Legal Help Easily.</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              Navigate your legal options with confidence by finding verified WA State attorneys and Pro-Bono firms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={onGoToLogin}
                className="bg-primary-container text-white font-body-md text-body-md px-8 py-3 rounded-lg hover:bg-on-primary-fixed transition-colors font-semibold shadow-sm flex justify-center items-center gap-2"
              >
                Log In / Sign Up
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
              <button 
                onClick={onGuestEntry}
                className="text-secondary border-2 border-secondary font-body-md text-body-md px-8 py-3 rounded-lg hover:bg-surface-container-low transition-colors font-semibold flex justify-center items-center"
              >
                Continue as Guest
              </button>
            </div>
            <p className="font-body-sm text-[14px] text-outline mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-vault-secure">verified_user</span>
              No commitment required for guest entry.
            </p>
          </div>
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-fixed to-surface-container-high rounded-2xl transform rotate-3 scale-105 opacity-50"></div>
            <img 
              alt="A bright, modern office interior with glass walls and natural light, conveying professionalism and transparency." 
              className="relative z-10 w-full h-auto rounded-2xl shadow-lg border border-outline-variant object-cover aspect-[4/3]" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXu5TVq9LMH6wDzlmrRD4819p765wLwLwhIfrqVy2UVQMAvnlBYmn1hKtvt9fa77Esl-fYkxFl4Zx1lCRkd2Ftil-n5YXKJT55a_kB2K-SYiaxtVnLhbjuVNnfgtYKXqljSx44EzUmb20CfLT9ZIR5LaYMRmzIu7KQBu0W33JBFyB9gsa7fgDwPpLNAT0tCjpW-TER1ohflK4CYhVTnwPqwX7_E_flMX3kmd-vG132RrvH2q1l-m1opmsOMfnxDlvMMzCWrnXVUA"
            />
            {/* Floating Trust Badge */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-slate-100 z-20 flex items-center gap-3">
              <div className="bg-surface-container-low p-2 rounded-full text-primary-container">
                <span className="material-symbols-outlined fill">gavel</span>
              </div>
              <div>
                <p className="font-label-caps text-label-caps text-outline">VERIFIED</p>
                <p className="font-body-md text-body-md font-semibold text-primary">WA State Bar Directory</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
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
};;
