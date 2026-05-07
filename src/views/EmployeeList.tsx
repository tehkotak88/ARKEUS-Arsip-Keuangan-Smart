import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Edit2,
  Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { formatDateString } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Employee {
  id: string;
  name: string;
  nip: string;
  currentRank: string;
  nextPangkatDate: string;
  nextKgbDate: string;
  status: string;
}

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*');
      
      if (data) setEmployees(data as Employee[]);
      if (error) console.error('Error fetching employees:', error);
      setLoading(false);
    };

    fetchEmployees();

    const subscription = supabase
      .channel('employee-list-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        fetchEmployees();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.nip.includes(searchTerm)
  );

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus data pegawai ini?')) {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      if (error) alert('Gagal menghapus: ' + error.message);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Database Pegawai</h1>
          <p className="text-slate-500 mt-1 font-medium">{employees.length} data tersimpan secara aman.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
             <input 
               type="text" 
               placeholder="Cari NIP / Nama..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="bg-white border border-slate-200 pl-11 pr-4 py-3.5 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none w-72 transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
             />
           </div>
           <button className="p-3.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all text-slate-500 shadow-sm">
             <Filter size={20} />
           </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm glow-indigo">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Profil Pegawai</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Pangkat/Gol</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Est. Pangkat</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Est. KGB</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {filteredEmployees.map((emp) => (
                  <motion.tr 
                    key={emp.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="group hover:bg-slate-50 cursor-pointer transition-all"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold border border-indigo-100 shadow-sm">
                          {emp.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                            {emp.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{emp.nip}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[11px] font-bold text-slate-600 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                        {emp.currentRank}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-amber-600">
                      {formatDateString(emp.nextPangkatDate)}
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-indigo-600">
                      {formatDateString(emp.nextKgbDate)}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/edit-employee/${emp.id}`); }}
                          className="p-2.5 bg-white border border-slate-100 hover:border-indigo-200 hover:text-indigo-600 rounded-xl transition-all text-slate-400 shadow-sm"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(emp.id, e)}
                          className="p-2.5 bg-white border border-slate-100 hover:border-rose-200 hover:text-rose-600 rounded-xl transition-all text-slate-400 shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filteredEmployees.length === 0 && !loading && (
          <div className="p-20 text-center flex flex-col items-center">
            <Search size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">Tampaknya data yang Anda cari tidak tersedia.</p>
          </div>
        )}
      </div>
    </div>
  );
}
