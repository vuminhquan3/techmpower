import { motion } from 'motion/react';

export default function LoadingScreen() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-brand-bg flex flex-col items-center justify-center p-4"
    >
      <div className="relative">
        <motion.div 
          animate={{ 
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 border-8 border-black flex items-center justify-center bg-white shadow-[8px_8px_0px_0px_#0047AB]"
        >
          <div className="w-10 h-10 border-4 border-black rotate-45" />
        </motion.div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 flex flex-col items-center"
      >
        <span className="text-black font-display font-black tracking-[0.5em] uppercase text-xs">BOOTING SYSTEM</span>
        <div className="mt-4 w-64 h-4 border-4 border-black bg-white relative overflow-hidden shadow-brutal">
           <motion.div 
             animate={{ x: [-256, 256] }}
             transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
             className="absolute inset-y-0 w-32 bg-brand-accent p-1"
           >
             <div className="w-full h-full border-2 border-white/20" />
           </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
