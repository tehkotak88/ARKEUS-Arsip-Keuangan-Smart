import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  User,
  Hash,
  Award,
  Calendar,
  DollarSign
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateNextPangkat, calculateNextKgb } from '../lib/utils';
import { format } from 'date-fns';

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    nip: '',
    name: '',
    currentRank: '',
    currentSalary: 0,
    lastPangkatDate: format(new Date(), 'yyyy-MM-dd'),
    lastKgbDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'active'
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const fetchEmployee = async () => {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', id)
          .single();
        
        if (data) {
          setFormData({
            nip: data.nip || '',
            name: data.name || '',
            currentRank: data.currentRank || '',
            currentSalary: Number(data.currentSalary) || 0,
            lastPangkatDate: data.lastPangkatDate || '',
            lastKgbDate: data.lastKgbDate || '',
            status: data.status || 'active'
          });
        }
        if (error) console.error('Error fetching employee:', error);
      };
      fetchEmployee();
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const nextPangkatDate = calculateNextPangkat(formData.lastPangkatDate);
      const nextKgbDate = calculateNextKgb(formData.lastKgbDate);

      const finalData = {
        ...formData,
        nextPangkatDate: format(nextPangkatDate, 'yyyy-MM-dd'),
        nextKgbDate: format(nextKgbDate, 'yyyy-MM-dd'),
        updatedAt: new Date().toISOString()
      };

      let error;
      if (isEdit) {
        const { error: err } = await supabase
          .from('employees')
          .update(finalData)
          .eq('id', id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from('employees')
          .insert([finalData]);
        error = err;
      }

      if (error) throw error;
      navigate('/employees');
    } catch (error: any) {
      console.error('Database Error:', error);
      alert('Gagal menyimpan data: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-3.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all shadow-sm text-slate-400 group"
        >
          <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {isEdit ? 'Ubah Informasi' : 'Registrasi Pegawai'}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Lengkapi data primer untuk monitoring karir otomatis.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-10 rounded-3xl space-y-10 shadow-sm">
        {/* Section: Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <InputGroup 
            label="NIP (NOMOR INDUK PEGAWAI)" 
            icon={<Hash size={18} />}
            required
          >
            <input 
              type="text" 
              required
              value={formData.nip}
              onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all font-mono text-slate-900 placeholder:text-slate-400 font-bold"
              placeholder="19850101XXXXXXXXX"
            />
          </InputGroup>

          <InputGroup 
            label="NAMA LENGKAP" 
            icon={<User size={18} />}
            required
          >
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all font-bold text-slate-900 placeholder:text-slate-400"
              placeholder="Masukkan nama tanpa gelar"
            />
          </InputGroup>

          <InputGroup 
            label="PANGKAT / GOLONGAN" 
            icon={<Award size={18} />}
            required
          >
            <div className="relative">
              <select 
                required
                value={formData.currentRank}
                onChange={(e) => setFormData({ ...formData, currentRank: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all appearance-none text-slate-900 font-bold"
              >
                <option value="">Pilih Golongan</option>
                <option value="IV/e">Pembina Utama (IV/e)</option>
                <option value="IV/d">Pembina Utama Madya (IV/d)</option>
                <option value="IV/c">Pembina Utama Muda (IV/c)</option>
                <option value="IV/b">Pembina Tingkat I (IV/b)</option>
                <option value="IV/a">Pembina (IV/a)</option>
                <option value="III/d">Penata Tingkat I (III/d)</option>
                <option value="III/c">Penata (III/c)</option>
                <option value="III/b">Penata Muda Tingkat I (III/b)</option>
                <option value="III/a">Penata Muda (III/a)</option>
              </select>
            </div>
          </InputGroup>

          <InputGroup 
            label="GAJI POKOK TERAKHIR" 
            icon={<DollarSign size={18} />}
          >
            <input 
              type="number" 
              value={formData.currentSalary}
              onChange={(e) => setFormData({ ...formData, currentSalary: parseFloat(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all font-bold text-emerald-600"
            />
          </InputGroup>
        </div>

        <div className="h-px bg-slate-100 w-full"></div>

        {/* Section: Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <InputGroup 
            label="TMT PANGKAT TERAKHIR" 
            icon={<Calendar size={18} />}
            required
          >
            <input 
              type="date" 
              required
              value={formData.lastPangkatDate}
              onChange={(e) => setFormData({ ...formData, lastPangkatDate: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all text-slate-900 font-bold"
            />
            <p className="text-[10px] text-amber-600 bg-amber-50 px-3 py-1 rounded-md border border-amber-100 mt-3 font-bold uppercase tracking-widest leading-relaxed italic w-fit">
              * Rekomendasi kenaikan pangkat otomatis +4 Tahun
            </p>
          </InputGroup>

          <InputGroup 
            label="TMT KGB TERAKHIR" 
            icon={<Calendar size={18} />}
            required
          >
            <input 
              type="date" 
              required
              value={formData.lastKgbDate}
              onChange={(e) => setFormData({ ...formData, lastKgbDate: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all text-slate-900 font-bold"
            />
            <p className="text-[10px] text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-100 mt-3 font-bold uppercase tracking-widest leading-relaxed italic w-fit">
              * Rekomendasi KGB selanjutnya otomatis +2 Tahun
            </p>
          </InputGroup>
        </div>

        <div className="flex gap-4 pt-6">
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            className="flex-1 py-4.5 bg-white hover:bg-slate-50 text-slate-500 rounded-2xl font-bold transition-all border border-slate-200 shadow-sm"
          >
            CANCEL
          </button>
          <button 
            type="submit" 
            disabled={submitting}
            className="flex-[2] py-4.5 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all uppercase tracking-widest"
          >
            {submitting ? 'PROCESSING...' : (
              <>
                <Save size={20} />
                Confirm & Save Record
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function InputGroup({ label, icon, children, required }: { label: string, icon: React.ReactNode, children: React.ReactNode, required?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold flex items-center gap-2 text-slate-400 uppercase tracking-[0.2em]">
        <span className="text-slate-300">{icon}</span>
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}
