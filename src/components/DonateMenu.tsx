
import { motion } from 'motion/react';
import { QrCode, TrendingUp, Info, DollarSign, Package, Heart, Share2, Check } from 'lucide-react';
import { DONATION_LEVELS, PC_COMPONENTS } from '../constants';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { resolveAsset } from '../lib/assets';
import { useLanguage } from '../context/LanguageContext';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 }
};

interface Donation {
  id: string;
  amount: number;
  donorName: string;
  timestamp: any;
}

export default function DonateMenu() {
  const { t } = useLanguage();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  useEffect(() => {
    const q = query(
      collection(db, 'donations'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const donationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Donation[];
      setDonations(donationList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'donations');
    });

    return () => unsubscribe();
  }, []);

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto px-6 pt-32 pb-20 space-y-12"
    >
      <div className="flex justify-between items-center bg-brand-accent text-white border-4 border-black p-6 shadow-brutal">
        <h2 className="text-2xl font-display font-black uppercase tracking-tight text-white">{t.donate.support}</h2>
        <button 
          onClick={handleShare}
          className="btn-brutal bg-white text-black py-2 px-6 shadow-[2px_2px_0px_0px_#000]"
        >
          {copied ? <Check size={16} className="text-green-600" /> : <Share2 size={16} />}
          {copied ? 'COPIED!' : 'SHARE'}
        </button>
      </div>

      {/* Donation Levels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {DONATION_LEVELS.map((level) => (
          <motion.div 
            key={level.label}
            variants={item}
            className="group card-brutal flex flex-col justify-between hover:bg-brand-bg transition-colors"
          >
            <div className="flex justify-between items-start mb-10">
              <span className="chip-brutal bg-brand-accent text-white border-brand-accent">
                {level.label}
              </span>
              <Heart size={20} className="text-brand-accent group-hover:fill-brand-accent transition-all" />
            </div>
            <div>
              <div className="text-3xl font-display font-black tracking-tighter mb-3">{formatVND(level.amount)}</div>
              <p className="text-black/60 text-[10px] font-black uppercase tracking-widest leading-relaxed">{level.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
        <motion.div variants={item} className="lg:col-span-4 card-brutal flex flex-col items-center overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white">
          <div className="w-full bg-white border-b-4 border-black p-6 flex justify-center overflow-hidden">
            <div className="bg-white border-2 border-black shadow-brutal overflow-hidden">
              <img 
                src={resolveAsset('assets/qr.png')} 
                alt="Donation QR" 
                className="w-full max-w-[340px] h-auto object-contain" 
              />
            </div>
          </div>
          <div className="p-8 w-full space-y-6 flex flex-col items-center">
            <div className="text-center">
              <h3 className="text-2xl font-display font-black uppercase tracking-tighter mb-1">{t.donate.bankTransfer}</h3>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="chip-brutal bg-black text-white px-6">{t.donate.verifiedAccount}</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-8 card-brutal flex flex-col">
           <div className="flex items-center justify-between mb-10 pb-6 border-b-4 border-black border-dotted">
              <h3 className="text-3xl font-display font-black uppercase tracking-tighter italic flex items-center gap-4">
                <Heart className="text-brand-accent fill-brand-accent" size={32} />
                {t.donate.recent}
              </h3>
           </div>
           <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
              {donations.length > 0 ? (
                donations.map((donation) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={donation.id} 
                    className="flex items-center justify-between p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group"
                  >
                     <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-black flex items-center justify-center text-white border-2 border-black">
                           <DollarSign size={24} />
                        </div>
                        <div>
                           <div className="font-display font-black text-black uppercase tracking-tight text-lg">{donation.donorName}</div>
                           <div className="text-xs text-black/40 uppercase font-bold tracking-widest">
                             {donation.timestamp?.toDate ? donation.timestamp.toDate().toLocaleString('vi-VN') : 'Ledger Verified'}
                           </div>
                        </div>
                     </div>
                     <div className="text-2xl font-display font-black text-brand-accent tracking-tighter">+{formatVND(donation.amount)}</div>
                  </motion.div>
                ))
              ) : (
                <div className="py-24 text-center border-4 border-dashed border-black flex flex-col items-center gap-6">
                   <Heart className="opacity-10" size={64} />
                   <span className="text-sm uppercase font-black tracking-[0.5em] text-black/30">{t.donate.noDonations}</span>
                </div>
              )}
           </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
