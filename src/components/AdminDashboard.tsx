
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Heart, Calendar, MoreVertical, Search, Filter, LogOut, ShieldCheck, UserPlus, Trash2, Trophy, Image as ImageIcon } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, setDoc, doc, deleteDoc, addDoc, serverTimestamp, getDocs, writeBatch, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { useLanguage } from '../context/LanguageContext';

interface Donation {
  id: string;
  amount: number;
  donorName: string;
  timestamp: any;
}

interface Admin {
  id: string;
  email: string;
  role: string;
}

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

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  
  // New Admin Form
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // Event Form (handles both Create and Edit)
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    type: 'Tournament',
    featured: false,
    image: '',
    url: '',
    details: '',
    insights: {
      format: '',
      purpose: '',
      join: ''
    }
  });
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  // Manual Donation Form
  const [manualDonation, setManualDonation] = useState({
    donorName: '',
    amount: ''
  });
  const [isLoggingDonation, setIsLoggingDonation] = useState(false);

  // Insights Management
  const [insights, setInsights] = useState({
    format: '',
    purpose: '',
    join: ''
  });
  const [isSavingInsights, setIsSavingInsights] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        // Hardcoded bootstrap check + lookup
        const isBootstrapAdmin = u.email === 'kenvuofficial@gmail.com';
        if (isBootstrapAdmin) {
          setIsAuthorized(true);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', u.email!));
            if (adminDoc.exists()) {
              setIsAuthorized(true);
            } else {
              setIsAuthorized(false);
            }
          } catch (error) {
            console.error("Admin verification error", error);
            setIsAuthorized(false);
          }
        }
      } else {
        setUser(null);
        setIsAuthorized(null);
      }
      setLoading(false);
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch Donations
    const qDonations = query(
      collection(db, 'donations'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubDonations = onSnapshot(qDonations, (snapshot) => {
      const donationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Donation[];
      setDonations(donationList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'donations');
    });

    // Fetch Admins
    const unsubAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
      const adminList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Admin[];
      setAdmins(adminList);
    }, (error) => {
      console.warn('Could not fetch admins - permission restricted');
    });

    // Fetch Events
    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      const eventList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventData[];
      setEvents(eventList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'events');
    });

    return () => {
      unsubDonations();
      unsubAdmins();
      unsubEvents();
    };
  }, [user]);

  const handleGoogleLogin = async () => {
    console.log('Attempting Google Login...');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      const result = await signInWithPopup(auth, provider);
      console.log('Login successful', result.user.email);
    } catch (error: any) {
      console.error('Login failed details:', error);
      if (error.code === 'auth/popup-blocked') {
        alert(t.admin.popupBlocked || "Popup blocked! Please allow popups for this site.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Ignore user cancellation
      } else {
        alert(`Login failed: ${error.message}`);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    setIsAddingAdmin(true);
    try {
      await setDoc(doc(db, 'admins', newAdminEmail), {
        email: newAdminEmail,
        role: 'editor',
        addedBy: user?.email
      });
      setNewAdminEmail('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'admins');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRevokeAdmin = async (id: string, email: string) => {
    if (!window.confirm(`${t.admin.revokeConfirm} (${email})`)) return;
    try {
      await deleteDoc(doc(db, 'admins', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'admins');
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEvent(true);
    try {
      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        date: eventForm.date,
        location: eventForm.location,
        type: eventForm.type,
        featured: eventForm.featured,
        image: eventForm.image,
        url: eventForm.url,
        details: !eventForm.featured ? eventForm.details : null,
        insights: eventForm.featured ? eventForm.insights : null,
        updatedAt: new Date().toISOString()
      };

      if (editingEventId) {
        await setDoc(doc(db, 'events', editingEventId), eventData, { merge: true });
      } else {
        await addDoc(collection(db, 'events'), {
          ...eventData,
          createdAt: new Date().toISOString()
        });
      }

      setEventForm({
        title: '',
        description: '',
        date: '',
        location: '',
        type: 'Tournament',
        featured: false,
        image: '',
        url: '',
        insights: {
          format: '',
          purpose: '',
          join: ''
        }
      });
      setEditingEventId(null);
    } catch (error) {
      handleFirestoreError(error, editingEventId ? OperationType.UPDATE : OperationType.CREATE, 'events');
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleEditEvent = (event: EventData) => {
    setEditingEventId(event.id);
    setEventForm({
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      type: event.type,
      featured: event.featured,
      image: event.image || '',
      url: event.url || '',
      details: event.details || '',
      insights: event.insights || {
        format: '',
        purpose: '',
        join: ''
      }
    });
    // Scroll to form
    const formElement = document.getElementById('event-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setEventForm({
      title: '',
      description: '',
      date: '',
      location: '',
      type: 'Tournament',
      featured: false,
      image: '',
      url: '',
      details: '',
      insights: {
        format: '',
        purpose: '',
        join: ''
      }
    });
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm(t.admin.deleteEventConfirm)) return;
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'events');
    }
  };

  const handleLogDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDonation.donorName || !manualDonation.amount) return;
    setIsLoggingDonation(true);
    try {
      await addDoc(collection(db, 'donations'), {
        donorName: manualDonation.donorName,
        amount: parseInt(manualDonation.amount),
        timestamp: serverTimestamp(),
        verified: true
      });
      setManualDonation({ donorName: '', amount: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'donations');
    } finally {
      setIsLoggingDonation(false);
    }
  };

  const handleSaveInsights = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInsights(true);
    try {
      await setDoc(doc(db, 'settings', 'insights'), insights);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/insights');
    } finally {
      setIsSavingInsights(false);
    }
  };

  const handleDeleteDonation = async (id: string) => {
    if (!window.confirm(t.admin.deleteEventConfirm)) return;
    try {
      await deleteDoc(doc(db, 'donations', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'donations');
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm(t.admin.clearHistoryConfirm)) return;
    
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'donations'));
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'donations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user && isAuthorized === false) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 pt-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-brand-border p-10 rounded-[2rem] w-full max-w-md shadow-2xl text-center"
        >
          <div className="inline-flex w-20 h-20 bg-red-500/20 rounded-3xl items-center justify-center text-red-500 mb-6 shadow-glow">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-extrabold mb-2 tracking-tight">{t.admin.unauthorized}</h2>
          <p className="text-gray-500 mb-10 text-sm">{t.admin.notAdmin}</p>

          <button 
            onClick={handleLogout}
            className="w-full bg-white text-black hover:bg-gray-100 py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95"
          >
            {t.admin.signOut}
          </button>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 pt-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-brand-border p-10 rounded-[2rem] w-full max-w-md shadow-2xl text-center"
        >
          <div className="inline-flex w-20 h-20 bg-brand-accent/20 rounded-3xl items-center justify-center text-brand-accent mb-6 shadow-glow">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-extrabold mb-2 tracking-tight">{t.admin.gate}</h2>
          <p className="text-gray-500 mb-10 text-sm">{t.admin.authorizedOnly}</p>

          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white text-black hover:bg-gray-100 py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            {t.admin.signInGoogle}
          </button>
          
          <p className="mt-8 text-[10px] uppercase font-bold tracking-[0.2em] text-gray-600">
             {t.admin.encrypted}
          </p>
        </motion.div>
      </div>
    );
  }

  const totalImpact = donations.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="max-w-7xl mx-auto p-4 pt-24 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 text-brand-accent mb-2">
             <LayoutDashboard size={20} />
             <span className="text-xs font-black uppercase tracking-widest">{t.admin.controlPanel}</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight">
             {t.admin.hello}, <span className="text-brand-accent">{user.displayName?.split(' ')[0]}</span>
          </h2>
          <p className="text-gray-500">{t.admin.managing}</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-bold">{user.email}</span>
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest text-right">{t.admin.systemAdmin}</span>
           </div>
           <button 
            onClick={handleLogout}
            className="bg-white hover:bg-red-50 text-gray-600 hover:text-red-500 p-4 rounded-2xl transition-all border border-brand-border shadow-sm"
            title="Sign Out"
           >
              <LogOut size={20} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
         <div className="bg-white border border-brand-border p-8 rounded-[2rem] shadow-xl">
            <div className="text-black text-[10px] font-black uppercase tracking-[0.2em] mb-3 opacity-60">{t.admin.revenueFlow}</div>
            <div className="text-4xl font-black tracking-tighter text-brand-accent">
               {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalImpact)}
            </div>
            <div className="text-[10px] text-green-500 mt-4 flex items-center gap-1 font-black uppercase tracking-widest italic">
               <span>{t.admin.activeStream}</span>
            </div>
         </div>

         {/* Manual Donation Form */}
         <div className="md:col-span-3 bg-white border border-brand-border p-8 rounded-[2rem] shadow-xl">
            <div className="flex items-center gap-3 mb-6">
               <Heart size={16} className="text-brand-accent" />
               <h4 className="text-sm font-black uppercase tracking-widest">{t.admin.manualDonation}</h4>
            </div>
            <form onSubmit={handleLogDonation} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div>
                  <input 
                     type="text" 
                     placeholder={t.admin.donorName}
                     required
                     value={manualDonation.donorName}
                     onChange={(e) => setManualDonation({...manualDonation, donorName: e.target.value})}
                     className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-black focus:border-brand-accent outline-none"
                  />
               </div>
               <div>
                  <input 
                     type="number" 
                     placeholder={t.admin.amountVnd}
                     required
                     value={manualDonation.amount}
                     onChange={(e) => setManualDonation({...manualDonation, amount: e.target.value})}
                     className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-black focus:border-brand-accent outline-none"
                  />
               </div>
               <button 
                  type="submit" 
                  disabled={isLoggingDonation}
                  className="bg-brand-accent hover:bg-blue-600 disabled:bg-gray-700 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
               >
                  {isLoggingDonation ? '...' : t.admin.logDonation}
               </button>
            </form>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         {/* Recent Activity */}
         <div className="lg:col-span-8 bg-white border border-brand-border rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-brand-border flex items-center justify-between bg-white">
               <h3 className="font-black uppercase tracking-tighter text-xl flex items-center gap-3 text-black">
                  <Heart size={20} className="text-brand-accent" />
                  {t.admin.ledger}
               </h3>
               <div className="flex gap-2">
                  <button 
                    onClick={handleClearHistory}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20"
                  >
                     {t.admin.clearHistory}
                  </button>
                  <button className="p-3 hover:bg-brand-accent/5 rounded-xl text-gray-500 transition-colors border border-brand-border"><Search size={18}/></button>
                  <button className="p-3 hover:bg-brand-accent/5 rounded-xl text-gray-500 transition-colors border border-brand-border"><Filter size={18}/></button>
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-white border-b border-brand-border">
                     <tr>
                        <th className="px-8 py-6 text-[10px] uppercase tracking-[0.3em] font-black text-black">{t.admin.benefactor}</th>
                        <th className="px-8 py-6 text-[10px] uppercase tracking-[0.3em] font-black text-black">{t.admin.allocation}</th>
                        <th className="px-8 py-6 text-[10px] uppercase tracking-[0.3em] font-black text-black">{t.admin.verification}</th>
                        <th className="px-8 py-6 text-[10px] uppercase tracking-[0.3em] font-black text-black">{t.admin.operations}</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/50">
                     {donations.length > 0 ? (
                       donations.map((donation) => (
                        <tr key={donation.id} className="hover:bg-brand-accent/5 transition-all group bg-white">
                           <td className="px-8 py-6">
                              <div className="font-black text-base group-hover:text-brand-accent transition-colors uppercase tracking-tight text-black">{donation.donorName}</div>
                              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 opacity-60">
                                {donation.timestamp?.toDate ? donation.timestamp.toDate().toLocaleDateString() : 'Real-time Signal'}
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="text-xl font-black tracking-[-0.05em] text-brand-accent">
                                 {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(donation.amount)}
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className="px-4 py-1.5 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-[0.15em] rounded-lg border border-green-500/20">{t.admin.success}</span>
                           </td>
                           <td className="px-8 py-6">
                              <button 
                                onClick={() => handleDeleteDonation(donation.id)}
                                className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full text-gray-500 transition-all active:scale-95"
                                title={t.admin.deleteDonation}
                              >
                                <Trash2 size={20} />
                              </button>
                           </td>
                        </tr>
                       ))
                     ) : (
                       <tr>
                         <td colSpan={4} className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center gap-4 text-gray-600">
                               <div className="w-12 h-12 border-2 border-dashed border-gray-700 rounded-full animate-spin duration-slow" />
                               <span className="text-[10px] font-black uppercase tracking-[0.5em]">{t.admin.awaiting}</span>
                            </div>
                         </td>
                       </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Task Queue */}
         <div className="lg:col-span-4 bg-white border border-brand-border rounded-[2rem] p-6">
            <h3 className="font-bold flex items-center gap-2 mb-6">
               <Calendar size={18} className="text-brand-accent" />
               {t.admin.tasks}
            </h3>
            <div className="space-y-4">
               {[
                  { name: t.admin.taskValorant, date: t.admin.today, status: 'High' },
                  { name: t.admin.taskEmail, date: t.admin.tomorrow, status: 'Med' },
                  { name: t.admin.taskSocial, date: t.admin.pending, status: 'Low' }
               ].map((task) => (
                  <div key={task.name} className="p-4 bg-white rounded-2xl border border-brand-border flex items-center justify-between group hover:shadow-md transition-all">
                     <div>
                        <div className="font-bold text-sm">{task.name}</div>
                        <div className="text-xs text-gray-500">{task.date}</div>
                     </div>
                     <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${
                        task.status === 'High' ? 'text-red-500 bg-red-500/10' : 
                        task.status === 'Med' ? 'text-orange-500 bg-orange-500/10' :
                        'text-blue-500 bg-blue-500/10'
                     }`}>
                        {task.status}
                     </span>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* Admin Management Section */}
      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="mt-12 mb-12"
      >
         <div className="flex items-center gap-3 text-brand-accent mb-6">
            <UserPlus size={20} />
            <h3 className="text-xl font-black uppercase tracking-tighter italic">{t.admin.adminManagement}</h3>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Add Admin Form */}
            <div className="lg:col-span-4 bg-white border border-brand-border rounded-[2.5rem] p-8 shadow-xl">
               <h4 className="font-bold text-lg mb-6">{t.admin.addAdmin}</h4>
               <form onSubmit={handleAddAdmin} className="space-y-4">
                  <div>
                     <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">{t.admin.adminEmail}</label>
                     <input 
                        type="email" 
                        required
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-black focus:border-brand-accent outline-none transition-colors"
                     />
                  </div>
                  <button 
                     type="submit" 
                     disabled={isAddingAdmin}
                     className="w-full bg-brand-accent hover:bg-blue-600 disabled:bg-gray-700 py-3 rounded-xl font-bold text-sm transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-brand-accent/20"
                  >
                     {isAddingAdmin ? '...' : t.admin.addBtn}
                  </button>
               </form>
            </div>

            {/* Existing Admins List */}
            <div className="lg:col-span-8 bg-white border border-brand-border rounded-[2.5rem] p-8 shadow-xl overflow-hidden">
               <h4 className="font-bold text-lg mb-6">{t.admin.existingAdmins}</h4>
               <div className="space-y-3">
                  {admins.map((admin) => (
                     <div key={admin.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-brand-border group hover:border-brand-accent/30 transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-brand-accent/10 rounded-full flex items-center justify-center text-brand-accent font-bold">
                              {admin.email?.charAt(0).toUpperCase()}
                           </div>
                           <div>
                              <div className="font-bold text-black text-sm">{admin.email}</div>
                              <div className="flex gap-2 items-center">
                                 <span className="px-2 py-0.5 bg-brand-accent/5 text-[8px] text-brand-accent border border-brand-accent/20 rounded uppercase font-bold tracking-tighter">
                                    {admin.role}
                                 </span>
                              </div>
                           </div>
                        </div>
                        {admin.email !== 'kenvuofficial@gmail.com' && (
                           <button 
                              onClick={() => handleRevokeAdmin(admin.id, admin.email)}
                              className="text-gray-600 hover:text-red-500 p-2 transition-colors opacity-0 group-hover:opacity-100"
                           >
                              <Trash2 size={18} />
                           </button>
                        )}
                     </div>
                  ))}
                  {admins.length === 0 && (
                     <div className="text-center py-12 text-gray-500 border border-dashed border-brand-border rounded-2xl">
                        <ShieldCheck className="mx-auto mb-2 opacity-20" size={32} />
                        <span className="text-xs uppercase font-black tracking-widest opacity-40">System Root Only</span>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </motion.div>

      {/* Event Management Section */}
      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="mt-12 mb-24"
         id="event-form"
      >
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-brand-accent">
               <Trophy size={20} />
               <h3 className="text-xl font-black uppercase tracking-tighter italic">{t.admin.eventManagement}</h3>
            </div>
            {!editingEventId && (
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 animate-pulse">
                Tip: Click the edit icon on an active movement to manage its insights or details
              </span>
            )}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Add/Edit Event Form */}
            <div className="lg:col-span-12 bg-white border border-brand-border rounded-[2.5rem] p-8 shadow-xl">
               <h4 className="font-bold text-lg mb-6">
                  {editingEventId ? t.admin.editEvent : t.admin.addNewEvent}
               </h4>
               <form onSubmit={handleSaveEvent} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                     <div>
                        <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">{t.admin.eventTitle}</label>
                        <input 
                           type="text" 
                           required
                           value={eventForm.title}
                           onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                           className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-black focus:border-brand-accent outline-none transition-colors"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">{t.admin.eventDate}</label>
                        <input 
                           type="text" 
                           required
                           value={eventForm.date}
                           onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                           placeholder="June 15, 2026"
                           className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-black focus:border-brand-accent outline-none transition-colors"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">{t.admin.eventLocation}</label>
                        <input 
                           type="text" 
                           required
                           value={eventForm.location}
                           onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                           className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-black focus:border-brand-accent outline-none transition-colors"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">{t.admin.eventType}</label>
                        <input 
                           type="text" 
                           required
                           value={eventForm.type}
                           onChange={(e) => setEventForm({...eventForm, type: e.target.value})}
                           className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-black focus:border-brand-accent outline-none transition-colors"
                        />
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div>
                        <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">{t.admin.eventDesc}</label>
                        <textarea 
                           required
                           rows={3}
                           value={eventForm.description}
                           onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                           className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-black focus:border-brand-accent outline-none transition-colors resize-none"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">{t.admin.eventImg}</label>
                        <input 
                           type="url" 
                           value={eventForm.image}
                           onChange={(e) => setEventForm({...eventForm, image: e.target.value})}
                           placeholder="https://..."
                           className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-black focus:border-brand-accent outline-none transition-colors"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">{t.admin.eventUrl}</label>
                        <input 
                           type="url" 
                           value={eventForm.url}
                           onChange={(e) => setEventForm({...eventForm, url: e.target.value})}
                           placeholder="https://registration-link.com"
                           className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-black focus:border-brand-accent outline-none transition-colors"
                        />
                     </div>
                     <div className="flex items-center gap-3 py-2">
                        <input 
                           type="checkbox" 
                           id="featured"
                           checked={eventForm.featured}
                           onChange={(e) => setEventForm({...eventForm, featured: e.target.checked})}
                           className="w-5 h-5 rounded border-brand-border bg-brand-bg text-brand-accent focus:ring-brand-accent"
                        />
                        <label htmlFor="featured" className="text-sm font-bold text-gray-400 cursor-pointer">{t.admin.eventFeatured}</label>
                     </div>
                  </div>

                  <div className="space-y-4">
                     {eventForm.featured ? (
                       <>
                         <div className="bg-white p-4 rounded-2xl border border-brand-border mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent">Spotlight Insights</span>
                         </div>
                          <div>
                            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">{t.admin.tournamentFormat}</label>
                            <textarea 
                               value={eventForm.insights.format}
                               onChange={(e) => setEventForm({...eventForm, insights: {...eventForm.insights, format: e.target.value}})}
                               rows={3}
                               className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-black focus:border-brand-accent outline-none transition-colors resize-none"
                            />
                         </div>
                         <div>
                            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">{t.admin.whyWeDoThis}</label>
                            <textarea 
                               value={eventForm.insights.purpose}
                               onChange={(e) => setEventForm({...eventForm, insights: {...eventForm.insights, purpose: e.target.value}})}
                               rows={3}
                               className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-black focus:border-brand-accent outline-none transition-colors resize-none"
                            />
                         </div>
                         <div>
                            <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">{t.admin.joinMovement}</label>
                            <textarea 
                               value={eventForm.insights.join}
                               onChange={(e) => setEventForm({...eventForm, insights: {...eventForm.insights, join: e.target.value}})}
                               rows={3}
                               className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-black focus:border-brand-accent outline-none transition-colors resize-none"
                            />
                         </div>
                       </>
                     ) : (
                       <>
                         <div className="bg-white p-4 rounded-2xl border border-brand-border mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-black">Regular Event Details</span>
                         </div>
                         <div>
                            <label className="block text-[10px] uppercase font-black tracking-widest text-black mb-2">Extended Event Details</label>
                            <textarea 
                               value={eventForm.details}
                               onChange={(e) => setEventForm({...eventForm, details: e.target.value})}
                               rows={11}
                               placeholder="Add detailed information about the event here. This will be visible in the 'Details' modal."
                               className="w-full bg-white border border-brand-border rounded-xl px-4 py-3 text-sm text-black focus:border-brand-accent outline-none transition-colors resize-none"
                            />
                         </div>
                       </>
                     )}
                  </div>

                  <div className="md:col-span-3 flex gap-4">
                     <button 
                        type="submit" 
                        disabled={isSavingEvent}
                        className="flex-grow bg-brand-accent hover:bg-blue-600 disabled:bg-gray-700 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all transform hover:scale-[1.01] active:scale-95 shadow-lg shadow-brand-accent/20"
                     >
                        {isSavingEvent ? '...' : (editingEventId ? t.admin.updateEvent : t.admin.createEvent)}
                     </button>
                     {editingEventId && (
                       <button 
                         type="button"
                         onClick={handleCancelEdit}
                         className="px-8 bg-gray-800 hover:bg-gray-700 rounded-xl font-black uppercase tracking-widest text-xs transition-all"
                       >
                         {t.admin.cancel}
                       </button>
                     )}
                  </div>
               </form>
            </div>

            {/* Event List */}
            <div className="lg:col-span-12 bg-white border border-brand-border rounded-[2.5rem] p-8 shadow-xl">
               <div className="flex items-center justify-between mb-8">
                  <h4 className="font-bold text-lg">{t.admin.existingEvents}</h4>
                  <span className="text-[10px] font-black tracking-widest uppercase text-gray-500">{events.length} TOTAL</span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {events.map((event) => (
                     <div key={event.id} className="bg-white rounded-3xl border border-brand-border overflow-hidden group hover:border-brand-accent/50 transition-all flex flex-col shadow-sm">
                        {event.image && (
                           <div className="h-32 w-full overflow-hidden relative">
                              <img src={event.image} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                           </div>
                        )}
                        <div className="p-6 flex-grow">
                           <div className="flex justify-between items-start mb-4">
                              <span className="bg-brand-accent/10 text-brand-accent text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-brand-accent/20">
                                 {event.type}
                                 {event.featured && " • SPOTLIGHT"}
                              </span>
                              <div className="flex gap-2">
                                 <button 
                                    onClick={() => handleEditEvent(event)}
                                    className="p-2 bg-white hover:bg-brand-accent hover:text-white rounded-lg transition-all text-gray-400 border border-brand-border/10"
                                    title={t.admin.edit}
                                 >
                                    <ShieldCheck size={14} />
                                 </button>
                                 <button 
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className="p-2 bg-white hover:bg-red-500 hover:text-white rounded-lg transition-all text-gray-400 border border-brand-border/10"
                                    title={t.admin.delete}
                                 >
                                    <Trash2 size={14} />
                                 </button>
                              </div>
                           </div>
                           <h5 className="font-black uppercase tracking-tight text-black mb-2">{event.title}</h5>
                           <p className="text-xs text-black italic mb-4 line-clamp-2">{event.description}</p>
                           <div className="space-y-1 text-[10px] text-black font-bold uppercase tracking-widest">
                              <div className="flex items-center gap-2">
                                 <Calendar size={12} className="text-brand-accent" />
                                 <span>{event.date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <ImageIcon size={12} className="text-brand-accent" />
                                 <span className="truncate">{event.location}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </motion.div>
    </div>
  );
}
