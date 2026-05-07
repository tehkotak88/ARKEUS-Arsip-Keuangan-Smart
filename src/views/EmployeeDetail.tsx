import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit2, 
  Calendar, 
  Award, 
  TrendingUp, 
  ArrowUpCircle,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDateString, cn } from '../lib/utils';
import { motion } from 'motion/react';

interface Employee {
  id: string;
  name: string;
  nip: string;
  currentRank: string;
  currentSalary: number;
  lastPangkatDate: string;
  nextPangkatDate: string;
  lastKgbDate: string;
  nextKgbDate: string;
}

interface HistoryItem {
  id: string;
  type: 'pangkat' | 'kgb';
  date: string;
  value: string;
  note: string;
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  useEffect(() => {
    if (!id) return;

    const fetchEmployee = async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) setEmployee(data as Employee);
      if (error) console.error('Error fetching employee:', error);
    };
    fetchEmployee();

    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('employeeId', id);
      
      if (data) setHistory(data as HistoryItem[]);
      if (error) console.error('Error fetching history:', error);
    };
    fetchHistory();

    const subscription = supabase
      .channel(`history-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'history', filter: `employeeId=eq.${id}` }, () => {
        fetchHistory();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  const handleRequestPromotion = async (type: 'pangkat' | 'kgb') => {
    if (!employee) return;
    
    if (window.confirm(`Ajukan permohonan ${type.toUpperCase()} untuk ${employee.name}?`)) {
      const { error } = await supabase
        .from('approvals')
        .insert([{
          employeeId: employee.id,
          employeeName: employee.name,
          type,
          newValue: type === 'pangkat' ? 'Pangkat Selanjutnya' : 'Gaji Selanjutnya',
          status: 'pending',
          requestDate: new Date().toISOString(),
        }]);
      
      if (error) {
        alert('Gagal mengajukan permohonan: ' + error.message);
      } else {
        alert('Permohonan telah diajukan ke atasan.');
        navigate('/approvals');
      }
    }
  };

  if (!employee) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate('/employees')}
            className="p-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all group shadow-sm"
          >
            <ArrowLeft size={20} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">{employee.name}</h1>
            <p className="text-slate-500 font-bold tracking-widest text-[10px] uppercase bg-slate-100 px-2.5 py-1 rounded-md inline-block">NIP: {employee.nip}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/edit-employee/${employee.id}`)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all text-slate-600 shadow-sm"
          >
            <Edit2 size={14} /> Ubah Profil
          </button>
          <button 
            onClick={() => handleRequestPromotion('pangkat')}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <ArrowUpCircle size={14} /> Ajukan Naik Pangkat
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('info')}
          className={cn(
            "pb-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative",
            activeTab === 'info' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Informasi Dasar
          {activeTab === 'info' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 shadow-[0_4px_10px_rgba(79,70,229,0.3)]" />}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "pb-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative",
            activeTab === 'history' ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Riwayat Karir
          {activeTab === 'history' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 shadow-[0_4px_10px_rgba(79,70,229,0.3)]" />}
        </button>
      </div>

      {activeTab === 'info' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-2">Status Kepangkatan</h3>
            <div className="bg-white border border-slate-200 p-8 rounded-[2rem] glow-indigo space-y-6 shadow-sm">
              <DetailRow icon={<Award size={18} />} label="Golongan Saat Ini" value={employee.currentRank} />
              <DetailRow icon={<Calendar size={18} />} label="TMT Pangkat Terakhir" value={formatDateString(employee.lastPangkatDate)} />
              <DetailRow icon={<TrendingUp size={18} />} label="Estimasi Naik Pangkat" value={formatDateString(employee.nextPangkatDate)} variant="amber" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-2">Status Gaji (KGB)</h3>
            <div className="bg-white border border-slate-200 p-8 rounded-[2rem] glow-indigo space-y-6 shadow-sm">
              <DetailRow icon={<FileText size={18} />} label="Gaji Pokok Terakhir" value={`Rp ${employee.currentSalary.toLocaleString('id-ID')}`} />
              <DetailRow icon={<Calendar size={18} />} label="TMT KGB Terakhir" value={formatDateString(employee.lastKgbDate)} />
              <DetailRow icon={<TrendingUp size={18} />} label="Estimasi KGB Selanjutnya" value={formatDateString(employee.nextKgbDate)} variant="indigo" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[2rem] glow-indigo overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Tanggal</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Tipe</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Keterangan</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Nominal/Pangkat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length > 0 ? [...history].sort((a,b) => b.date.localeCompare(a.date)).map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-slate-500 font-mono">{formatDateString(item.date)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border tracking-wider",
                      item.type === 'pangkat' 
                        ? "bg-amber-50 text-amber-600 border-amber-100" 
                        : "bg-indigo-50 text-indigo-600 border-indigo-100"
                    )}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{item.note || '-'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">{item.value}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400 text-sm italic font-medium">Belum ada riwayat tercatat.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value, variant }: { icon: React.ReactNode, label: string, value: string, variant?: 'indigo' | 'amber' }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-4 text-slate-400 group-hover:text-slate-600 transition-colors">
        <div className={cn(
          "p-2.5 rounded-xl border transition-colors",
          variant === 'amber' ? "bg-amber-50 border-amber-100 text-amber-600" :
          variant === 'indigo' ? "bg-indigo-50 border-indigo-100 text-indigo-600" :
          "bg-slate-50 border-slate-100 text-slate-400"
        )}>
          {icon}
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest leading-none">{label}</span>
      </div>
      <span className={cn(
        "font-bold transition-all", 
        variant === 'amber' ? "text-amber-600 text-lg bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100 shadow-sm" : 
        variant === 'indigo' ? "text-indigo-600 text-lg bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 shadow-sm" : 
        "text-slate-800"
      )}>
        {value}
      </span>
    </div>
  );
}
