import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation,
  useNavigate
} from 'react-router-dom';
import { 
  Users, 
  LayoutDashboard, 
  FileText, 
  CheckCircle, 
  UserPlus,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from './lib/firebase';
// unused imports removed
import { cn } from './lib/utils';
import { format } from 'date-fns';

// Views
import Dashboard from './views/Dashboard';
import EmployeeList from './views/EmployeeList';
import EmployeeForm from './views/EmployeeForm';
import ApprovalSystem from './views/ApprovalSystem';
import Reports from './views/Reports';
import EmployeeDetail from './views/EmployeeDetail';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-16 h-16 border-[3px] border-slate-100 border-t-indigo-600 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center">
               <Users size={16} className="text-indigo-600" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-slate-900 selection:bg-indigo-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(79,70,229,0.08),rgba(0,0,0,0))]" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200 text-center relative z-10 glow-indigo"
        >
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-600/20">
            <Users size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3 text-slate-900">SimpegPakar</h1>
          <p className="text-slate-500 mb-10 font-medium tracking-wide">Sistem Informasi Manajemen Pegawai & Pengingat Karir Otomatis</p>
          <button 
            onClick={loginWithGoogle}
            className="w-full py-4.5 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-95"
          >
            Masuk dengan Google
          </button>
          <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Authorized Access Only</p>
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex p-4 gap-4 overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          "bg-white border border-slate-200 rounded-[2rem] flex flex-col transition-all duration-500 z-50 shadow-sm",
          sidebarOpen ? "w-64 p-6" : "w-20 p-4"
        )}>
          <div className="flex items-center justify-between mb-10">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Users size={22} className="text-white" />
                </div>
                <span className="font-extrabold text-xl tracking-tight uppercase text-slate-900">SIMPEG</span>
              </div>
            )}
            {!sidebarOpen && (
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto">
                <Users size={20} className="text-white" />
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-1">
            <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={sidebarOpen} />
            <NavItem to="/employees" icon={<Users size={20} />} label="Daftar Pegawai" active={sidebarOpen} />
            <NavItem to="/add-employee" icon={<UserPlus size={20} />} label="Input Data" active={sidebarOpen} />
            <NavItem to="/approvals" icon={<CheckCircle size={20} />} label="Persetujuan" active={sidebarOpen} />
            <NavItem to="/reports" icon={<FileText size={20} />} label="Statistik" active={sidebarOpen} />
          </nav>

          <div className="mt-auto space-y-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
               {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className={cn("bg-slate-50 rounded-2xl p-4 border border-slate-100", !sidebarOpen && "flex justify-center")}>
              {sidebarOpen ? (
                <>
                  <p className="text-sm font-bold truncate text-slate-900">{user.displayName}</p>
                </>
              ) : (
                <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-slate-200" />
              )}
            </div>
            <button 
              onClick={logout}
              className={cn(
                "w-full flex items-center gap-3 p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors",
                !sidebarOpen && "justify-center"
              )}
            >
              <LogOut size={20} />
              {sidebarOpen && <span className="font-bold text-sm">Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col gap-4 min-w-0">
          <header className="h-16 bg-white border border-slate-200 rounded-3xl flex items-center justify-between px-8 shrink-0 shadow-sm">
             <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
               <span>{format(new Date(), 'EEEE, dd MMMM yyyy')}</span>
             </div>
             <div className="flex items-center gap-4">
               {/* Notification icon removed */}
             </div>
          </header>

          <div className="flex-1 overflow-y-auto px-2">
            <div className="pb-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/employees" element={<EmployeeList />} />
                <Route path="/employees/:id" element={<EmployeeDetail />} />
                <Route path="/add-employee" element={<EmployeeForm />} />
                <Route path="/edit-employee/:id" element={<EmployeeForm />} />
                <Route path="/approvals" element={<ApprovalSystem />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </Router>
  );
}

function NavItem({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
        isActive 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
          : "text-slate-500 hover:bg-slate-50"
      )}
    >
      <span className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600")}>{icon}</span>
      {active && <span className="font-bold text-sm tracking-wide">{label}</span>}
    </Link>
  );
}

