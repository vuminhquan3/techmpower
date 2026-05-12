import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import MainMenu from './components/MainMenu';
import DonateMenu from './components/DonateMenu';
import EventsMenu from './components/EventsMenu';
import AdminDashboard from './components/AdminDashboard';
import LoadingScreen from './components/LoadingScreen';
import { TabType } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { resolveAsset } from './lib/assets';

import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Handle initial hash to allow deep-linking (e.g. #donate)
    const hash = window.location.hash.replace('#', '') as TabType;
    if (['main', 'donate', 'events', 'admin'].includes(hash)) {
      setActiveTab(hash);
    }

    // Artificial delay for high-end feel and asset loading simulation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Update URL hash when tab changes
  useEffect(() => {
    if (!isLoading) {
      window.location.hash = activeTab;
    }
  }, [activeTab, isLoading]);

  const renderContent = () => {
    switch (activeTab) {
      case 'main':
        return <MainMenu onNavigate={setActiveTab} />;
      case 'donate':
        return <DonateMenu />;
      case 'events':
        return <EventsMenu />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <MainMenu />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg selection:bg-brand-accent selection:text-white relative">
      <AnimatePresence>
        {isLoading && <LoadingScreen key="loader" />}
      </AnimatePresence>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="py-20 border-t-8 border-black mt-20 relative z-10 bg-white shadow-[0_-12px_24px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_#0047AB] overflow-hidden">
               <img 
                 src={resolveAsset('assets/logo.png')} 
                 alt="TechMPower" 
                 className="w-full h-full object-cover"
                 onError={(e) => {
                   // If logo doesn't exist in assets/, show geometric fallback
                   const target = e.target as HTMLImageElement;
                   target.style.display = 'none';
                   const parent = target.parentElement;
                   if (parent) {
                     const fallback = document.createElement('div');
                     fallback.className = 'w-6 h-6 border-4 border-white rotate-45';
                     parent.appendChild(fallback);
                   }
                 }}
               />
            </div>
            <span className="font-display font-black text-black tracking-tight text-2xl uppercase">TechMPower</span>
          </div>
          <div className="text-center md:text-left">
            <p className="text-black text-sm font-black uppercase tracking-tight mb-2">Empowering Digital Futures</p>
            <p className="text-black/40 text-[10px] font-bold uppercase tracking-[0.2em]">© 2026 TechMPower Advocacy. Recorded on the Ledger.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
             {['Terms', 'Privacy', 'Contact'].map(link => (
               <a key={link} href="#" className="text-black hover:text-brand-accent font-black uppercase text-xs tracking-[0.2em] transition-all hover:-translate-y-0.5">{link}</a>
             ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

