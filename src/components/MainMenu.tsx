
import { motion } from 'motion/react';
import { ArrowRight, Globe, Mail, Facebook, Instagram, ShieldCheck, Users, Target } from 'lucide-react';
import { TEAM_MEMBERS } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { TabType } from '../constants';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export default function MainMenu({ onNavigate }: { onNavigate?: (tab: TabType) => void }) {
  const { t } = useLanguage();
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-20 mt-24 space-y-32 mb-40">
      {/* Hero Section */}
      <motion.section 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-12"
      >
        <motion.div variants={item} className="chip-brutal">
          {t.main.nonprofit}
        </motion.div>

        <div className="space-y-4 max-w-5xl">
          <motion.h1 variants={item} className="text-6xl md:text-8xl lg:text-9xl font-display font-black leading-[0.9] tracking-[-0.04em]">
            {t.main.tagline}
          </motion.h1>
          <motion.div variants={item} className="inline-block bg-brand-accent px-4 py-2 md:px-8 md:py-4 border-4 border-black shadow-brutal">
            <h1 className="text-4xl md:text-8xl lg:text-9xl font-display font-black leading-[0.9] tracking-[-0.04em] text-white">
              {t.main.tagline2}
            </h1>
          </motion.div>
        </div>

        <motion.p variants={item} className="text-lg md:text-xl text-gray-700 font-bold max-w-2xl leading-relaxed italic border-l-4 border-black pl-6">
          {t.main.intro}
        </motion.p>

        <motion.div variants={item} className="flex flex-wrap gap-6 pt-4">
          <button 
            onClick={() => onNavigate?.('donate')}
            className="btn-brutal btn-brutal-primary h-16 px-10 text-lg"
          >
            {t.main.donateNow}
            <ArrowRight size={24} className="transition-transform group-hover:translate-x-2" />
          </button>
          
          <button 
            onClick={() => onNavigate?.('events')}
            className="btn-brutal h-16 px-10 text-lg"
          >
            {t.main.seeEvents}
          </button>
        </motion.div>

        {/* Live Counter Section */}
        <motion.div variants={item} className="card-brutal mt-20 relative bg-white">
          <div className="flex justify-between items-center mb-12">
            <div className="chip-brutal bg-black text-white px-4 py-2">
              {t.main.liveCounter}
            </div>
            <span className="font-display font-black tracking-widest text-lg">{t.main.year}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CounterCard value="42" label={t.main.computersBuilt} />
            <CounterCard value="120+" label={t.main.studentsReached} />
            <CounterCard value="$8,400" label={t.main.fundsRaised} />
            <CounterCard value="24" label={t.main.volunteers} />
          </div>
        </motion.div>
      </motion.section>

      {/* Team/Vision sections */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-8 card-brutal space-y-12"
        >
          <div className="flex items-center gap-6 pb-6 border-b-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-black text-white border-2 border-black flex items-center justify-center">
              <Users size={32} />
            </div>
            <h2 className="text-4xl md:text-5xl italic">{t.main.team}</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.name} className="flex flex-col items-center gap-4 group">
                <div className="border-4 border-black shadow-brutal w-full aspect-square overflow-hidden bg-white group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-center">
                  <p className="font-display font-bold uppercase text-xs tracking-tight">{member.name}</p>
                  <p className="text-[9px] font-black text-black/40 uppercase tracking-widest">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-4 card-brutal bg-brand-accent text-white border-brand-accent shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between"
        >
          <div className="space-y-10">
            <h2 className="text-4xl italic text-white">{t.main.vision}</h2>
            <div className="space-y-4">
              {[
                { icon: Instagram, label: 'Instagram', url: 'https://www.instagram.com/techmpower.official/' },
                { icon: Facebook, label: 'Facebook', url: 'https://www.facebook.com/techmpower' },
                { icon: Mail, label: 'Email', url: 'mailto:contact@techmpower.org' }
              ].map((social) => (
                <a 
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  className="flex items-center justify-between p-5 border-2 border-white hover:bg-white hover:text-brand-accent transition-all font-black uppercase tracking-widest text-xs group"
                >
                  <div className="flex items-center gap-4">
                    <social.icon size={20} />
                    {social.label}
                  </div>
                  <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </a>
              ))}
            </div>
          </div>


        </motion.div>
      </section>
    </div>
  );
}

function CounterCard({ value, label }: { value: string, label: string }) {
  return (
    <div className="border-2 border-brand-border p-6 md:p-8 bg-white hover:bg-brand-accent/5 transition-colors">
      <div className="text-4xl md:text-6xl font-black tracking-tighter text-brand-accent mb-2">
        {value}
      </div>
      <div className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-black/60">
        {label}
      </div>
    </div>
  );
}
