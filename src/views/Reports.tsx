import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Download, 
  TrendingUp, 
  Award,
  Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isDueSoon, isOverdue, formatDateString, cn } from '../lib/utils';

interface Employee {
  id: string;
  name: string;
  nip: string;
  currentRank: string;
  nextPangkatDate: string;
  nextKgbDate: string;
}

const COLORS = ['#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'];
const PIE_COLORS = ['#f59e0b', '#10b981', '#475569'];

export default function Reports() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeReport, setActiveReport] = useState<'statistics' | 'pangkat' | 'kgb'>('statistics');

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*');
      
      if (data) setEmployees(data as Employee[]);
      if (error) console.error('Error fetching employees:', error);
    };

    fetchEmployees();

    const subscription = supabase
      .channel('reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        fetchEmployees();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Data Preparation
  const pangkatDue = employees.filter(e => isDueSoon(e.nextPangkatDate) || isOverdue(e.nextPangkatDate));
  const kgbDue = employees.filter(e => isDueSoon(e.nextKgbDate) || isOverdue(e.nextKgbDate));

  const rankStats = employees.reduce((acc: any, curr) => {
    acc[curr.currentRank] = (acc[curr.currentRank] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(rankStats).map(key => ({
    name: key,
    value: rankStats[key]
  }));

  const pieData = [
    { name: 'Siap Naik Pangkat', value: pangkatDue.length },
    { name: 'Siap KGB', value: kgbDue.length },
    { name: 'Normal', value: Math.max(0, employees.length - pangkatDue.length - kgbDue.length) }
  ];

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Laporan & Statistik</h1>
          <p className="text-slate-500 font-medium tracking-wide">Analisis mendalam data kepegawaian dan kepangkatan.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
          <Download size={16} /> Ekspor PDF
        </button>
      </div>

      {/* Report Type Selector */}
      <div className="flex p-1.5 bg-slate-100 shadow-inner rounded-2xl w-fit border border-slate-200">
        <ReportTab active={activeReport === 'statistics'} onClick={() => setActiveReport('statistics')} label="Statistik Pegawai" icon={<TrendingUp size={14} />} />
        <ReportTab active={activeReport === 'pangkat'} onClick={() => setActiveReport('pangkat')} label="Laporan Pangkat" icon={<Award size={14} />} />
        <ReportTab active={activeReport === 'kgb'} onClick={() => setActiveReport('kgb')} label="Laporan KGB" icon={<Calendar size={14} />} />
      </div>

      {activeReport === 'statistics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm glow-indigo">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-8">Distribusi Golongan Pegawai</h3>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '16px', 
                      border: '1px solid rgba(0,0,0,0.05)', 
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}
                    itemStyle={{ color: '#000', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={32}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm glow-indigo">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-8">Status Milestones</h3>
            <div className="h-[320px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} className="focus:outline-none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '16px', 
                      border: '1px solid rgba(0,0,0,0.05)', 
                    }}
                    itemStyle={{ color: '#000', fontSize: '12px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-6 mt-4">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }}></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {(activeReport === 'pangkat' || activeReport === 'kgb') && (
        <div className="bg-white border border-slate-200 rounded-[2rem] glow-indigo overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">
              Pegawai Siap {activeReport === 'pangkat' ? 'Kenaikan Pangkat' : 'KGB'} 
              <span className="ml-3 text-indigo-600 text-[10px] font-bold uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-md inline-block align-middle border border-indigo-100">
                {activeReport === 'pangkat' ? pangkatDue.length : kgbDue.length} Pegawai
              </span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Nama / NIP</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Golongan</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Estimasi TMT</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(activeReport === 'pangkat' ? pangkatDue : kgbDue).map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{emp.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5 uppercase">{emp.nip}</p>
                    </td>
                    <td className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">{emp.currentRank}</td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-600 font-mono">
                      {formatDateString(activeReport === 'pangkat' ? emp.nextPangkatDate : emp.nextKgbDate)}
                    </td>
                    <td className="px-8 py-5 text-right">
                      {isOverdue(activeReport === 'pangkat' ? emp.nextPangkatDate : emp.nextKgbDate) ? (
                        <span className="text-[9px] bg-rose-50 text-rose-600 px-3 py-1 rounded-md font-bold uppercase tracking-widest border border-rose-100">Terlewat</span>
                      ) : (
                        <span className="text-[9px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-md font-bold uppercase tracking-widest border border-indigo-100">Mendekati</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {((activeReport === 'pangkat' && pangkatDue.length === 0) || (activeReport === 'kgb' && kgbDue.length === 0)) && (
             <div className="p-20 text-center text-slate-400 text-sm italic font-medium">Tidak ada data untuk laporan ini.</div>
          )}
        </div>
      )}
    </div>
  );
}

function ReportTab({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all",
        active ? "bg-white text-indigo-600 shadow-md border border-slate-100" : "text-slate-500 hover:text-slate-700"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
