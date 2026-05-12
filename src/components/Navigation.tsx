import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ChevronDown, LayoutGrid, Heart, Calendar, ShieldCheck } from 'lucide-react';
import { TabType } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { resolveAsset } from '../lib/assets';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems: { id: TabType; label: string; icon: any }[] = [
    { id: 'main', label: t.nav.main, icon: LayoutGrid },
    { id: 'donate', label: t.nav.donate, icon: Heart },
    { id: 'events', label: t.nav.events, icon: Calendar },
    { id: 'admin', label: t.nav.admin, icon: ShieldCheck },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-[60] bg-white border-b-4 border-black h-24 flex items-center px-6 md:px-12">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        {/* Logo Section */}
        <button 
          onClick={() => setActiveTab('main')}
          className="flex items-center gap-3 group transition-transform active:scale-95"
        >
          <div className="w-12 h-12 bg-white flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_#0047AB] overflow-hidden">
            <img 
              src={resolveAsset('assets/logo.png')} 
              alt="Logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
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
          <span className="font-display font-black text-2xl tracking-tighter uppercase hidden sm:block">
            Tech<span className="text-brand-accent">M</span>Power
          </span>
        </button>

        {/* Right side: Language & Menu Dropdown */}
        <div className="flex items-center gap-2 md:gap-4 relative">
          {/* Language Switcher - Now visible on all sizes */}
          <div className="flex border-2 border-black p-0.5 bg-white shadow-[2px_2px_0px_0px_#000]">
            {(['en', 'vi'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 md:px-3 py-1 text-[9px] md:text-[10px] font-black uppercase transition-all ${
                  language === lang 
                    ? 'bg-brand-accent text-white' 
                    : 'text-black hover:bg-brand-accent/5'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Main Dropdown Trigger */}
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="btn-brutal h-10 md:h-12 px-2 md:px-4 flex items-center gap-2 md:gap-3 bg-white"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
              <span className="hidden sm:inline font-black text-[10px] md:text-xs tracking-widest">{isMenuOpen ? 'CLOSE' : 'MENU'}</span>
              <ChevronDown size={14} className={`hidden md:block transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* The "Dropbox" (Dropdown Menu) */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-72 bg-white border-4 border-black shadow-[12px_12px_0px_0px_#000] z-50 overflow-hidden"
                >
                  {/* Menu Items */}
                  <div className="p-2 space-y-1">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-4 p-4 font-black uppercase tracking-widest text-sm transition-all hover:translate-x-2 ${
                            isActive ? 'bg-brand-accent text-white' : 'hover:bg-brand-accent/5'
                          }`}
                        >
                          <Icon size={18} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="p-4 bg-black text-white text-[9px] font-black uppercase tracking-[0.3em] flex justify-center">
                    TechMPower 2026 • VIETNAM
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {/* Background Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 top-24 bg-white/20 backdrop-blur-sm -z-10"
          />
        )}
      </AnimatePresence>
    </header>
  );
}
