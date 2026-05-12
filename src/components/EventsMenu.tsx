
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Calendar, MapPin, Users, ArrowRight, Gamepad2, Info, Loader2, Target } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  type: string;
  featured: boolean;
  image?: string;
  url?: string;
  details?: string;
  insights?: {
    format: string;
    purpose: string;
    join: string;
  };
}

export default function EventsMenu() {
  const { t } = useLanguage();
  const [selectedEventForInfo, setSelectedEventForInfo] = useState<EventData | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [regularEvents, setRegularEvents] = useState<EventData[]>([]);
  const [featuredEvent, setFeaturedEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventData[];
      
      setEvents(eventList);
      setFeaturedEvent(eventList.find(e => e.featured) || null);
      setRegularEvents(eventList.filter(e => !e.featured));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching events:', error);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-brutal bg-black text-white"
      >
        <h2 className="text-4xl md:text-6xl font-display font-black mb-4 uppercase tracking-tighter text-white">
           {t.events.next} <span className="text-brand-accent italic">{t.events.movements}</span>
        </h2>
        <p className="text-white/60 font-black uppercase tracking-widest text-xs border-l-2 border-brand-accent pl-4">{t.events.eventIntro}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Featured Event */}
        {featuredEvent && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-12 relative min-h-[500px] md:min-h-[600px] border-4 border-black bg-white shadow-brutal overflow-hidden flex flex-col md:flex-row"
          >
            <div className="w-full md:w-1/2 relative h-[400px] md:h-auto border-b-4 md:border-b-0 md:border-r-4 border-black">
              <img 
                src={featuredEvent.image} 
                alt={featuredEvent.title}
                className="absolute inset-0 w-full h-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="chip-brutal bg-brand-accent text-white border-brand-accent shadow-brutal px-4">
                  {t.events.spotlight}
                </span>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <span className="chip-brutal">
                    {featuredEvent.type}
                  </span>
                </div>
                <h3 className="text-4xl md:text-7xl font-display font-black mb-8 leading-none uppercase tracking-tighter">{featuredEvent.title}</h3>
                <p className="text-black/80 mb-10 font-bold leading-relaxed italic text-lg border-l-4 border-black pl-6">
                  {featuredEvent.description}
                </p>
                
                <div className="space-y-6 mb-12 text-sm font-black uppercase tracking-widest">
                  <div className="flex items-center gap-4 pb-4 border-b-2 border-dashed border-black/10">
                    <Calendar size={24} className="text-brand-accent" />
                    <span>{featuredEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <MapPin size={24} className="text-brand-accent" />
                    <span>{featuredEvent.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-6">
                {featuredEvent.url && (
                  <a 
                    href={featuredEvent.url}
                    target="_blank"
                    className="btn-brutal btn-brutal-primary h-16 px-10 text-lg flex-grow justify-center"
                  >
                    {t.events.register} <ArrowRight size={20} />
                  </a>
                )}
                {featuredEvent.insights && (
                  <button 
                    onClick={() => setSelectedEventForInfo(featuredEvent)}
                    className="btn-brutal h-16 px-8 flex-grow justify-center"
                  >
                    {t.events.insights} <Info size={20} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
    
        {/* Regular Events */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-12">
          {regularEvents.map((event, idx) => (
            <motion.div 
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="group card-brutal flex flex-col justify-between"
            >
               <div>
                  {event.image && (
                    <div className="h-56 w-full overflow-hidden border-2 border-black mb-8 grayscale group-hover:grayscale-0 transition-all shadow-brutal group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1">
                       <img 
                        src={event.image} 
                        alt={event.title} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                       />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-6">
                    <span className="chip-brutal bg-black text-white px-4">
                       {event.type}
                    </span>
                  </div>
                  <h4 className="text-2xl md:text-3xl font-display font-black mb-4 uppercase tracking-tight">{event.title}</h4>
                  <p className="text-black/60 mb-10 font-bold leading-relaxed italic text-sm">{event.description}</p>
               </div>
               
               <div className="space-y-8">
                  <div className="space-y-4 font-black uppercase tracking-widest text-[11px] text-black/40 border-t-2 border-black border-dotted pt-8">
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-brand-accent" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-brand-accent" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    {event.details && (
                      <button 
                        onClick={() => setSelectedEventForInfo(event)}
                        className="btn-brutal p-4 shadow-[4px_4px_0px_0px_#000]"
                      >
                        <Info size={24} />
                      </button>
                    )}
                    {event.url && (
                      <a 
                        href={event.url}
                        target="_blank"
                        className="btn-brutal btn-brutal-primary flex-grow justify-center py-4"
                      >
                        {t.events.register}
                      </a>
                    )}
                  </div>
               </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedEventForInfo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEventForInfo(null)}
              className="absolute inset-0 bg-white/60 backdrop-blur-md"
             />
             <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateX: 10 }}
              className="bg-white border-4 border-black w-full max-w-2xl p-10 relative overflow-y-auto max-h-[90vh] shadow-[24px_24px_0px_0px_#000]"
             >
                <button 
                  onClick={() => setSelectedEventForInfo(null)}
                  className="absolute top-6 right-6 w-12 h-12 border-2 border-black flex items-center justify-center hover:bg-brand-accent hover:text-white transition-all font-black text-2xl"
                >
                   ✕
                </button>

                <div className="space-y-10">
                   <div className="flex items-center gap-6 text-brand-accent">
                      <div className="w-16 h-16 bg-black text-white flex items-center justify-center border-2 border-black shadow-brutal">
                        <Info size={36} />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-display font-black uppercase tracking-tighter">
                         {selectedEventForInfo.title}
                      </h2>
                   </div>

                   <div className="space-y-8">
                      <div className="bg-gray-50 border-4 border-black p-8 shadow-brutal">
                         <p className="text-lg leading-relaxed font-bold italic text-gray-800 whitespace-pre-wrap">
                          {selectedEventForInfo.featured ? selectedEventForInfo.insights?.purpose : selectedEventForInfo.details}
                         </p>
                      </div>

                      {selectedEventForInfo.featured && selectedEventForInfo.insights && (
                        <div className="grid grid-cols-1 gap-6">
                          {selectedEventForInfo.insights.format && (
                            <div className="border-4 border-black p-8 relative overflow-hidden group">
                              <div className="absolute top-0 left-0 w-full h-2 bg-brand-accent" />
                              <h4 className="font-display font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-3">
                                <Trophy size={24} className="text-brand-accent" /> {t.admin.tournamentFormat}
                              </h4>
                              <p className="text-base font-bold text-black leading-relaxed">{selectedEventForInfo.insights.format}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedEventForInfo.url && (
                        <a 
                          href={selectedEventForInfo.url}
                          target="_blank"
                          className="btn-brutal btn-brutal-primary w-full h-16 text-lg justify-center mt-6"
                        >
                           {t.events.register}
                        </a>
                      )}
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
