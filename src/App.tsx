import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation
} from 'react-router-dom';
import { 
  LogOut,
  Menu,
  Archive,
  FileText,
  CreditCard,
  Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from './lib/firebase';
import { cn } from './lib/utils';
import { format } from 'date-fns';

import EArsip from './views/EArsip';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-16 h-16 border-[3px] border-slate-100 border-t-indigo-600 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center">
               <Archive size={16} className="text-indigo-600" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(79,70,229,0.08),rgba(0,0,0,0))]" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-200 text-center relative z-10">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-600 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-xl shadow-indigo-600/20">
            <Archive size={32} className="text-white md:hidden" />
            <Archive size={40} className="text-white hidden md:block" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 md:mb-3 text-slate-900">ARKEUS</h1>
          <p className="text-slate-500 mb-8 md:mb-10 font-medium tracking-wide text-sm md:text-base">Arsip Keuangan Smart</p>
          <button onClick={loginWithGoogle}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 text-sm">
            Masuk dengan Google
          </button>
          <p className="mt-6 md:mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Authorized Access Only</p>
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row md:p-4 md:gap-4 overflow-hidden">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Archive size={18} className="text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight uppercase text-slate-900">ARKEUS</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500">
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 top-[57px] bg-black/30 backdrop-blur-sm z-40" onClick={() => setMobileMenuOpen(false)}>
              <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25 }}
                className="w-72 h-full bg-white border-r border-slate-200 p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                <nav className="space-y-2 mb-8">
                  <MobileNavItem to="/spm" icon={<FileText size={20} />} label="SPM" onClick={() => setMobileMenuOpen(false)} />
                  <MobileNavItem to="/spp" icon={<CreditCard size={20} />} label="SPP" onClick={() => setMobileMenuOpen(false)} />
                  <MobileNavItem to="/data-dukung" icon={<Paperclip size={20} />} label="Data Dukung" onClick={() => setMobileMenuOpen(false)} />
                </nav>
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-sm font-bold truncate text-slate-900">{user.displayName}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-1">{user.email}</p>
                  </div>
                  <button onClick={logout} className="w-full flex items-center gap-3 p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                    <LogOut size={20} /><span className="font-bold text-sm">Sign Out</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex bg-white border border-slate-200 rounded-[2rem] flex-col w-64 p-6 transition-all duration-500 z-50 shadow-sm">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Archive size={22} className="text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight uppercase text-slate-900">ARKEUS</span>
          </div>
          <nav className="flex-1 space-y-1">
            <NavItem to="/spm" icon={<FileText size={20} />} label="SPM" />
            <NavItem to="/spp" icon={<CreditCard size={20} />} label="SPP" />
            <NavItem to="/data-dukung" icon={<Paperclip size={20} />} label="Data Dukung" />
          </nav>
          <div className="mt-auto space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-sm font-bold truncate text-slate-900">{user.displayName}</p>
              <p className="text-[10px] text-slate-400 truncate mt-1">{user.email}</p>
            </div>
            <button onClick={logout} className="w-full flex items-center gap-3 p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
              <LogOut size={20} /><span className="font-bold text-sm">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col md:gap-4 min-w-0">
          {/* Desktop date header */}
          <header className="hidden md:flex h-16 bg-white border border-slate-200 rounded-3xl items-center justify-between px-8 shrink-0 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {format(new Date(), 'EEEE, dd MMMM yyyy')}
            </div>
          </header>
          <div className="flex-1 overflow-y-auto px-3 md:px-2">
            <div className="pb-8">
              <Routes>
                <Route path="/spm" element={<EArsip category="spm" />} />
                <Route path="/spp" element={<EArsip category="spp" />} />
                <Route path="/data-dukung" element={<EArsip category="data_dukung" />} />
                <Route path="/" element={<EArsip category="all" />} />
                <Route path="*" element={<EArsip category="all" />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </Router>
  );
}

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
      isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500 hover:bg-slate-50")}>
      <span className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600")}>{icon}</span>
      <span className="font-bold text-sm tracking-wide">{label}</span>
    </Link>
  );
}

function MobileNavItem({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} onClick={onClick} className={cn("flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all",
      isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-500 hover:bg-slate-50 active:bg-slate-100")}>
      <span className={cn(isActive ? "text-white" : "text-slate-400")}>{icon}</span>
      <span className="font-bold text-sm">{label}</span>
    </Link>
  );
}
