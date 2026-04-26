import React, { useState } from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { GoogleGenAI, Type } from "@google/genai";
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps';

import { Logo } from './Logo';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const Dashboard: React.FC<{ 
  isGuest: boolean; 
  isAuthenticated: boolean;
  onGoHome: () => void;
  onLogin: () => void;
  onLogout: () => void;
}> = ({ isGuest, isAuthenticated, onGoHome, onLogin, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'directory'>('search');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      parts: [{ text: "Hello! I am an AI assistant, not an attorney. I cannot provide legal advice. I can help you find free or private legal help. Briefly describe your problem, and I'll help you find the right lawyer." }]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [locationError, setLocationError] = useState('');
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState('Immigration');
  const [language, setLanguage] = useState('English');
  const [proBonoOnly, setProBonoOnly] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState<any>(null);
  const [searchError, setSearchError] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 47.6062, lng: -122.3321 });
  const [mapZoom, setMapZoom] = useState(12);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const validateWAZip = (zip: string) => /^9[89]\d{3}$/.test(zip);

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setZipCode(val);
    if (val.length === 5) {
      if (!validateWAZip(val)) {
        setLocationError("Zip code is invalid for Washington state or outside its boundaries.");
      } else {
        setLocationError("");
      }
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage: Message = { role: 'user', parts: [{ text: input }] };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      // Map history for SDK format
      const historyContents = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.parts[0].text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...historyContents, { role: 'user', parts: [{ text: input }] }],
        config: {
          systemInstruction: `You are Pacific LegalMaps AI, an assistant for Washington State legal inquiries.
          CONSTRAINTS:
          - Be concise and professional. Do NOT be overly familiar or chatty.
          - On the first message, offer this disclaimer: "I am an AI assistant, not an attorney. I cannot provide legal advice. I can help you find free or private legal help."
          - Detect the user's language and respond accordingly.
          - Triage the problem into categories: Housing (landlord, lease, eviction), Immigration (visa, deportation, asylum), Bankruptcy, Family, etc.
          - Ask about jurisdiction (city and state). Only provide info for Washington State.
          - If Housing: ask if they received a written notice and when.
          - NEVER say "You should do X." instead say "The law says X" or "Lawyers often look at Y."
          - If you don't know, say you cannot answer. Do not make assumptions.
          - If referencing a lawyer or firm, ONLY include a website URL if you have verified it exists. DO NOT guess or generate new URLs.
          - Goal: Generate a concise (max 50 word) Case Summary.`,
        }
      });
      
      if (response.text) {
        const aiMessage: Message = { role: 'model', parts: [{ text: response.text }] };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error("Chat Error:", err);
      // Fallback or error message
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateWAZip(zipCode)) {
      setLocationError("Zip code is invalid for Washington state or outside its boundaries.");
      return;
    }
    setSearchLoading(true);
    setSearchError('');
    try {
      // Map frontend selected area to WSBA specific tags
      const areaMap: Record<string, string> = {
        'Immigration': 'Immigration-Naturaliza',
        'Housing': 'Estate+Planning-Probate',
        'Family': 'Family',
        'Employment': 'Employment',
        'Bankruptcy': 'Bankruptcy',
        'Criminal': 'Criminal',
        'Injury': 'Personal+Injury',
        'Civil Rights': 'Constitutional',
        'Business': 'Business-Commercial',
        'IP Law': 'Intellectual+Property',
        'Tax Law': 'Tax',
        'Education': '', 
      };
      
      // Map languages to WSBA format if any
      const langMap: Record<string, string> = {
         'English': '',
         'Spanish': 'Spanish',
         'Vietnamese': 'Vietnamese',
         'Russian': 'Russian',
         'Chinese': 'Chinese',
         'Korean': 'Korean',
      };

      const mappedArea = areaMap[selectedArea] || '';
      const mappedLang = langMap[language] || '';

      const res = await axios.get('/api/lawyers', { 
        params: { 
           zip: zipCode, 
           city, 
           area: mappedArea,
           uiArea: selectedArea,
           language: mappedLang,
           status: proBonoOnly ? 'Pro+Bono' : 'Active'
        } 
      });
      
      if (res.data.error) {
         setLawyers([]);
         setSearchError(res.data.error);
         console.warn(res.data.error);
      } else {
         setSearchError('');
         setLawyers(res.data.lawyers || []);
         if (res.data.lawyers?.length > 0) {
           const first = res.data.lawyers[0];
           if (first.lat && first.lng) {
             setMapCenter({ lat: Number(first.lat), lng: Number(first.lng) });
             setMapZoom(11);
           }
         }
      }
      setActiveTab('directory');
    } catch (err) {
      console.error("Search failed:", err);
      // Ensure we clear previous on error
      setLawyers([]);
      setSearchError("Your search returned no results. Please try again.");
      setActiveTab('directory');
    } finally {
      setSearchLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'directory') {
      handleSearch();
    }
  }, [proBonoOnly]);

  const filteredLawyers = lawyers;

  return (
    <div className="bg-surface-muted text-on-surface font-body-md min-h-screen flex flex-col antialiased">
      {/* TopNavBar */}
      <header className="bg-primary text-white sticky top-0 z-50 border-b border-primary-container shadow-md">
        <div className="flex justify-between items-center h-16 px-6 md:px-12 max-w-[1200px] mx-auto w-full">
          <button 
            onClick={onGoHome}
            className="focus:outline-none"
          >
            <Logo variant="light" />
          </button>
          <nav className="hidden md:flex gap-8">
            <button 
              onClick={() => setActiveTab('search')}
              className={`font-semibold py-2 transition-all ${activeTab === 'search' ? 'text-primary-fixed border-b-2 border-primary-fixed' : 'text-primary-fixed/60 hover:text-white'}`}
            >
              Search
            </button>
            <button 
              onClick={() => setActiveTab('directory')}
              className={`font-semibold py-2 transition-all ${activeTab === 'directory' ? 'text-primary-fixed border-b-2 border-primary-fixed' : 'text-primary-fixed/60 hover:text-white'}`}
            >
              Directory
            </button>
          </nav>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <>
                <button className="text-primary-fixed/80 font-semibold hover:text-white transition-all px-4 py-2">
                  My Account
                </button>
                <button 
                  onClick={onLogout}
                  className="bg-white/10 text-white font-semibold hover:bg-white/20 transition-all duration-200 px-4 py-2 rounded"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button 
                onClick={onLogin}
                className="bg-primary-fixed text-primary font-semibold hover:bg-white transition-all duration-200 px-4 py-2 rounded shadow-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {activeTab === 'search' ? (
        /* Alignment & Preference / Intake View */
        <main className="flex-grow w-full max-w-[1200px] mx-auto px-6 py-stack-lg">
          <div className="mb-stack-lg text-center max-w-2xl mx-auto">
            <h1 className="font-h1 text-h1 text-primary mb-stack-sm">Alignment & Preferences</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">Help us find the right legal professional for your specific needs by adjusting the criteria below.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            {/* Context Sidebar */}
            <aside className="md:col-span-4 space-y-stack-md">
              <div className="bg-surface-container border border-outline-variant rounded-lg p-6 flex gap-4">
                <span className="material-symbols-outlined text-vault-secure mt-1">security</span>
                <div>
                  <h3 className="font-bold text-on-surface mb-1">Privacy Focused</h3>
                  <p className="text-sm text-on-surface-variant">These preferences are stored temporarily and are not permanently attached to your identity unless you create an account.</p>
                </div>
              </div>
            </aside>

            {/* Main Preference Forms */}
            <div className="md:col-span-8 space-y-stack-md">
                {/* AI Chatbot Section */}
                <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-primary-container p-2 rounded-lg text-white">
                            <span className="material-symbols-outlined">smart_toy</span>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                AI Legal Navigator
                                <span className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider">Gemma 4</span>
                            </h3>
                            <p className="text-on-surface-variant text-[14px]">Describe your problem to help me triage your case.</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg h-64 overflow-y-auto p-4 mb-4 border border-outline-variant flex flex-col gap-4">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${m.role === 'user' ? 'bg-primary-container text-white rounded-tr-none' : 'bg-surface-container-high text-on-surface rounded-tl-none'}`}>
                                    <div className="prose prose-sm max-none">
                                        <ReactMarkdown>{m.parts[0].text}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-surface-container-high px-4 py-2 rounded-2xl rounded-tl-none flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 bg-on-surface-variant rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <input 
                            type="text"
                            placeholder="Type Message..."
                            className="w-full bg-white border border-outline-variant rounded-lg pl-4 pr-12 py-3 focus:ring-2 focus:ring-secondary outline-none shadow-sm"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button onClick={handleSendMessage} className="absolute right-2 top-1.5 p-2 text-primary-container hover:bg-surface-container-low rounded-md transition-colors">
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </div>
                </section>

              {/* Location */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 md:p-8">
                <h2 className="font-h2 text-h2 text-on-surface mb-6 border-b border-outline-variant pb-4">Location</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-on-surface mb-2">City <span className="text-status-error">*</span></label>
                      <input 
                        className={`w-full border rounded p-3 bg-surface-bright focus:ring-secondary focus:border-secondary text-on-surface shadow-sm ${locationError ? 'border-error' : 'border-outline-variant'}`} 
                        type="text" 
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Seattle"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-on-surface mb-2">ZIP Code <span className="text-status-error">*</span></label>
                      <input 
                        className={`w-full border rounded p-3 bg-surface-bright focus:ring-secondary focus:border-secondary text-on-surface shadow-sm ${locationError ? 'border-error' : 'border-outline-variant'}`} 
                        type="text" 
                        value={zipCode}
                        onChange={handleZipChange}
                        placeholder="e.g. 98104"
                        required
                      />
                    </div>
                  </div>
                  {locationError && (
                    <div className="flex items-start gap-2 text-status-error bg-error-container p-4 rounded-lg">
                      <span className="material-symbols-outlined mt-0.5">error</span>
                      <p className="text-sm font-medium">{locationError}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Language */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 md:p-8">
                <h2 className="font-h2 text-h2 text-on-surface mb-6 border-b border-outline-variant pb-4">Language</h2>
                <div className="mt-6">
                  <label className="block font-bold text-on-surface mb-2">Primary Language</label>
                  <div className="relative">
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full border border-outline-variant rounded p-3 bg-surface-bright focus:ring-secondary focus:border-secondary text-on-surface shadow-sm appearance-none"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish (Español)</option>
                      <option value="Vietnamese">Vietnamese (Tiếng Việt)</option>
                      <option value="Russian">Russian (Русский)</option>
                      <option value="Chinese">Chinese (中文)</option>
                      <option value="Korean">Korean (한국어)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
                      <span className="material-symbols-outlined">expand_more</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Legal Focus Area */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 md:p-8">
                <h2 className="font-h2 text-h2 text-on-surface mb-6 border-b border-outline-variant pb-4">Legal Focus Area</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: 'Immigration', icon: 'public' },
                    { name: 'Housing', icon: 'home' },
                    { name: 'Family', icon: 'family_restroom' },
                    { name: 'Employment', icon: 'work' },
                    { name: 'Bankruptcy', icon: 'account_balance_wallet' },
                    { name: 'Criminal', icon: 'gavel' },
                    { name: 'Injury', icon: 'medical_services' },
                    { name: 'Civil Rights', icon: 'balance' },
                    { name: 'Business', icon: 'business' },
                    { name: 'IP Law', icon: 'lightbulb' },
                    { name: 'Tax Law', icon: 'payments' },
                    { name: 'Education', icon: 'school' }
                  ].map((area) => (
                    <button 
                      key={area.name} 
                      onClick={() => setSelectedArea(area.name)}
                      className={`flex flex-col items-center justify-center p-6 border rounded-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-secondary shadow-sm hover:shadow-md ${
                        selectedArea === area.name 
                          ? 'bg-primary text-white border-primary-fixed' 
                          : 'bg-surface-container-lowest border-outline-variant hover:border-secondary hover:bg-surface-muted'
                      }`}
                    >
                        <span className={`material-symbols-outlined text-3xl mb-3 transition-colors ${
                          selectedArea === area.name ? 'text-white' : 'text-primary'
                        }`} style={{ fontVariationSettings: "'FILL' 0" }}>
                          {area.icon}
                        </span>
                        <span className="text-sm font-bold tracking-tight">{area.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              <div className="flex justify-end gap-4 mt-stack-lg">
                <button 
                  onClick={handleSearch} 
                  disabled={searchLoading}
                  className="px-6 py-3 bg-primary text-white font-bold rounded hover:bg-opacity-90 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed min-w-[180px] justify-center"
                >
                  {searchLoading ? (
                    <>
                      <span>Searching</span>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </>
                  ) : (
                    <>
                      Search
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* Directory Results View */
        <main className="flex-grow flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto">
          {/* Left Column: Directory List */}
          <div className="w-full lg:w-7/12 p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-4">
              <div>
                <h1 className="font-h3 text-on-surface">Legal Professionals Near You</h1>
                <p className="font-body-md text-on-surface-variant mt-1">Found {filteredLawyers.length} results based on your criteria.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-body-md font-medium text-on-surface">Pro Bono Only</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    className="sr-only peer" 
                    type="checkbox" 
                    checked={proBonoOnly}
                    onChange={(e) => setProBonoOnly(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {searchLoading ? (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                  <h3 className="font-h3 text-on-surface mb-2">Loading Directory...</h3>
                  <p className="text-on-surface-variant max-w-md mx-auto">Please wait while we search the local directory for matching professionals.</p>
                </div>
              ) : searchError ? (
                <div className="bg-surface-container-lowest border border-error rounded-lg p-12 text-center">
                  <span className="material-symbols-outlined text-error text-5xl mb-4">search_off</span>
                  <h3 className="font-h3 text-error mb-2">Search Error</h3>
                  <p className="text-on-surface-variant max-w-md mx-auto">{searchError}</p>
                  <button onClick={() => { setActiveTab('search'); setSearchError(''); }} className="mt-6 px-6 py-2 bg-primary text-white rounded hover:bg-opacity-90">
                    Try Again
                  </button>
                </div>
              ) : filteredLawyers.length === 0 ? (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-12 text-center">
                  <span className="material-symbols-outlined text-outline text-5xl mb-4">search_off</span>
                  <h3 className="font-h3 text-on-surface mb-2">No Verified Lawyers Found</h3>
                  <p className="text-on-surface-variant max-w-md mx-auto">We couldn't find any lawyers matching your exact criteria who are currently verified in good standing.</p>
                  <button onClick={() => setActiveTab('search')} className="mt-6 px-6 py-2 border border-outline-variant rounded text-on-surface hover:bg-surface-muted transition-colors">
                    Adjust Preferences
                  </button>
                </div>
              ) : (
                filteredLawyers.map((l) => (
                  <article key={l.id} className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex flex-col gap-4 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.05)] hover:border-primary-fixed-dim transition-colors relative overflow-hidden">
                    {l.isProBono && <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>}
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-h3 uppercase">
                          {l.initials || l.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <h2 className="font-h3 text-on-surface flex items-center gap-2">
                            {l.name}
                            <span className="material-symbols-outlined text-status-success text-lg" title="WSBA Standing Verified">verified</span>
                          </h2>
                          <p className="font-body-md text-on-surface-variant">{l.firm || l.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {l.rating && (
                          <div className="flex items-center justify-end text-wa-state-gold gap-1">
                            <span className="material-symbols-outlined fill" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="font-body-lg font-bold text-on-surface">{l.rating}</span>
                          </div>
                        )}
                        <p className="font-body-md text-on-surface-variant mt-2 font-medium">{l.distance || '2.0 miles away'}</p>
                      </div>
                    </div>
                    
                    <div className="bg-surface-muted p-4 rounded-md mt-2 flex flex-col gap-2">
                        {l.address && <div className="flex items-start gap-2"><span className="material-symbols-outlined text-sm mt-1">location_on</span> <span className="text-sm">{l.address}</span></div>}
                        {l.phone && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">call</span> <span className="text-sm">{l.phone}</span></div>}
                        {l.email && <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">mail</span> <span className="text-sm"><a href={`mailto:${l.email}`} className="text-primary hover:underline">{l.email}</a></span></div>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="font-label-caps text-on-surface-variant mb-1">Practice Areas</p>
                        <div className="flex flex-wrap gap-2">
                          {l.practice.split(',').map((p: string) => (
                            <span key={p} className="px-2 py-1 bg-surface border border-outline-variant rounded text-sm text-on-surface">{p.trim()}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="font-label-caps text-on-surface-variant mb-1">Languages</p>
                        <div className="flex items-center gap-2 text-on-surface text-sm">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">language</span>
                          {language && language !== 'English' ? `English, ${language}` : 'English'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-outline-variant flex justify-end gap-3">
                      {l.website && (
                        <a 
                          href={l.website.startsWith('http') ? l.website : `http://${l.website}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-6 py-2 bg-primary text-white font-body-md font-medium rounded hover:bg-primary-fixed-dim transition-colors shadow-sm flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">public</span>Website
                        </a>
                      )}
                      {l.lat && l.lng && (
                        <button onClick={() => {
                           setSelectedLawyer(l);
                           setMapCenter({ lat: Number(l.lat), lng: Number(l.lng) });
                           setMapZoom(14);
                        }} className="px-6 py-2 border border-secondary text-secondary font-body-md font-medium rounded hover:bg-secondary hover:text-white transition-colors">Map Location</button>
                      )}
                    </div>
                </article>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Map Component */}
          <div className="w-full lg:w-5/12 bg-surface-variant border-l border-outline-variant hidden lg:block relative">
            <div className="sticky top-16 h-[calc(100vh-4rem)] w-full">
              {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                  <Map
                    style={{ width: '100%', height: '100%' }}
                    center={mapCenter}
                    zoom={mapZoom}
                    onCenterChanged={(e) => setMapCenter(e.detail.center)}
                    onZoomChanged={(e) => setMapZoom(e.detail.zoom)}
                    gestureHandling={'greedy'}
                    disableDefaultUI={false}
                    mapId="DEMO_MAP_ID"
                  >
                    {filteredLawyers.map((l) => (
                      l.lat && l.lng ? (
                        <AdvancedMarker 
                          key={l.id} 
                          position={{ lat: Number(l.lat), lng: Number(l.lng) }} 
                          onClick={() => setSelectedLawyer(l)}
                        >
                          <Pin background={'#0F52BA'} glyphColor={'#fff'} borderColor={'#000'} />
                        </AdvancedMarker>
                      ) : null
                    ))}

                    {selectedLawyer && (
                      <InfoWindow
                        position={{ lat: selectedLawyer.lat, lng: selectedLawyer.lng }}
                        onCloseClick={() => setSelectedLawyer(null)}
                      >
                        <div className="p-2 max-w-[200px]">
                          <h3 className="font-bold text-sm mb-1">{selectedLawyer.name}</h3>
                          <p className="text-xs text-slate-600 mb-2">{selectedLawyer.firm}</p>
                          <p className="text-xs font-semibold text-primary">{selectedLawyer.practice}</p>
                        </div>
                      </InfoWindow>
                    )}
                  </Map>
                </APIProvider>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-surface-container-low border border-dashed border-outline-variant">
                  <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4" style={{ fontVariationSettings: "'FILL' 0" }}>map</span>
                  <h3 className="font-bold text-on-surface mb-2">Maps API Key Required</h3>
                  <p className="text-sm text-on-surface-variant max-w-xs mb-6">
                    To enable the interactive map, please provide a Google Maps API Key in the <strong>Secrets</strong> panel under <strong>Settings</strong>.
                  </p>
                  <div className="bg-surface-container p-4 rounded-lg text-left text-xs font-mono border border-outline-variant">
                    <p className="font-bold mb-1">Variable Name:</p>
                    <p className="text-primary mb-3 select-all">VITE_GOOGLE_MAPS_API_KEY</p>
                    <p className="text-on-surface-variant text-[10px] italic">Setting this will enable location markers for legal professionals.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* Global Footer */}
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
