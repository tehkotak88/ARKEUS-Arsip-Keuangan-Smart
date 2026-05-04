import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Award, 
  AlertCircle,
  Clock,
  CheckCircle,
  UserPlus
} from 'lucide-react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { formatDateString, isDueSoon, isOverdue, cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

interface Employee {
  id: string;
  name: string;
  nip: string;
  currentRank: string;
  nextPangkatDate: string;
  nextKgbDate: string;
}

export default function Dashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pangkatDue, setPangkatDue] = useState<Employee[]>([]);
  const [kgbDue, setKgbDue] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'employees'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const emps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
      setEmployees(emps);
      
      setPangkatDue(emps.filter(e => isDueSoon(e.nextPangkatDate) || isOverdue(e.nextPangkatDate)));
      setKgbDue(emps.filter(e => isDueSoon(e.nextKgbDate) || isOverdue(e.nextKgbDate)));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="space-y-6 pt-4 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1 font-medium">Monitoring real-time data kepegawaian.</p>
        </div>
        <button 
          onClick={() => navigate('/add-employee')}
          className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30"
        >
          <UserPlus size={18} />
          Input Pegawai
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Users className="text-indigo-600" size={24} />} 
          label="Total Pegawai" 
          value={employees.length.toString()} 
          color="bg-indigo-50"
          glow="glow-indigo"
        />
        <StatCard 
          icon={<Award className="text-amber-600" size={24} />} 
          label="Siap Pangkat" 
          value={pangkatDue.length.toString()} 
          color="bg-amber-50"
          glow="glow-amber"
        />
        <StatCard 
          icon={<TrendingUp className="text-emerald-600" size={24} />} 
          label="Siap KGB" 
          value={kgbDue.length.toString()} 
          color="bg-emerald-50"
        />
        <StatCard 
          icon={<CheckCircle className="text-purple-600" size={24} />} 
          label="Approval Pending" 
          value="0"
          color="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reminders: Pangkat */}
        <section className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col min-h-[400px] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100">
                <AlertCircle size={22} />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Kenaikan Pangkat</h2>
            </div>
            <span className="text-[10px] font-bold px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 uppercase tracking-widest">
              {pangkatDue.length} Due
            </span>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto">
            {pangkatDue.length > 0 ? pangkatDue.slice(0, 5).map(emp => (
              <div key={emp.id}>
                <ReminderItem 
                  name={emp.name}
                  nip={emp.nip}
                  info={`Estimasi: ${formatDateString(emp.nextPangkatDate)}`}
                  overdue={isOverdue(emp.nextPangkatDate)}
                  onClick={() => { navigate(`/employees/${emp.id}`); }}
                />
              </div>
            )) : (
              <EmptyState message="Semua kenaikan pangkat terpantau aman." />
            )}
          </div>
          
          {pangkatDue.length > 5 && (
            <button 
              onClick={() => navigate('/reports?type=pangkat')}
              className="mt-6 w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border border-slate-200"
            >
              Lihat Laporan Lengkap
            </button>
          )}
        </section>

        {/* Reminders: KGB */}
        <section className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col min-h-[400px] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
                <Clock size={22} />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Pengingat KGB</h2>
            </div>
            <span className="text-[10px] font-bold px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 uppercase tracking-widest">
              {kgbDue.length} Due
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {kgbDue.length > 0 ? kgbDue.slice(0, 5).map(emp => (
              <div key={emp.id}>
                <ReminderItem 
                  name={emp.name}
                  nip={emp.nip}
                  info={`Estimasi: ${formatDateString(emp.nextKgbDate)}`}
                  overdue={isOverdue(emp.nextKgbDate)}
                  onClick={() => { navigate(`/employees/${emp.id}`); }}
                />
              </div>
            )) : (
              <EmptyState message="Tidak ada KGB yang jatuh tempo hari ini." />
            )}
          </div>

          {kgbDue.length > 5 && (
            <button 
              onClick={() => navigate('/reports?type=kgb')}
              className="mt-6 w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border border-slate-200"
            >
              Lihat Laporan Lengkap
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, glow }: { icon: React.ReactNode, label: string, value: string, color: string, glow?: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={cn("bg-white border border-slate-200 p-6 rounded-3xl flex items-center justify-between shadow-sm", glow)}
    >
      <div>
        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      </div>
      <div className={cn("p-4 rounded-2xl border border-white/50", color)}>
        {icon}
      </div>
    </motion.div>
  );
}

function ReminderItem({ name, nip, info, overdue, onClick }: { name: string, nip: string, info: string, overdue: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 cursor-pointer transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
          {name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
        </div>
        <div>
          <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{name}</h4>
          <p className="text-xs text-slate-500 font-medium tracking-tight">NIP: {nip}</p>
        </div>
      </div>
      <div className="text-right flex flex-col items-end gap-1">
        <p className={cn("text-[11px] font-bold uppercase tracking-wider", overdue ? "text-rose-600" : "text-slate-500")}>{info}</p>
        {overdue ? (
          <span className="text-[9px] font-bold px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-md uppercase">Critical</span>
        ) : (
          <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md uppercase">Soon</span>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
      <CheckCircle size={32} className="text-slate-300 mb-4" />
      <p className="text-sm text-slate-400 font-medium max-w-[200px] leading-relaxed">{message}</p>
    </div>
  );
}
