import React, { useState, useEffect } from 'react';
import { Archive, Plus, Search, Zap, Receipt, Calendar, DollarSign, FileText, Trash2, Eye, X, Upload, Clock, Droplets, Phone, Fuel, UtensilsCrossed, BarChart3, Paperclip, Users, Briefcase, FileStack, CreditCard } from 'lucide-react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type DocType = 
  | 'spm_tunkin' | 'spm_lainnya' | 'spm_gaji' | 'spm_makan' | 'spm_kontraktual' | 'spm_listrik'
  | 'spp_tunkin' | 'spp_lainnya' | 'spp_gaji' | 'spp_makan' | 'spp_kontraktual' | 'spp_listrik'
  | 'data_dukung';

interface ArsipDocument {
  id: string;
  type: DocType;
  title: string;
  nomorSurat: string;
  tanggal: string;
  nominal: number;
  keterangan: string;
  periode: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: any;
}

const DOC_TYPE_CONFIG: Record<DocType, { label: string; icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  spm_tunkin: { label: 'SPM Tunjangan Kinerja', icon: <DollarSign size={18} />, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-100' },
  spm_lainnya: { label: 'SPM Lainnya', icon: <FileText size={18} />, color: 'text-slate-600', bgColor: 'bg-slate-50', borderColor: 'border-slate-100' },
  spm_gaji: { label: 'SPM Gaji Induk', icon: <Users size={18} />, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-100' },
  spm_makan: { label: 'SPM Uang Makan', icon: <UtensilsCrossed size={18} />, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-100' },
  spm_kontraktual: { label: 'SPM Kontraktual Lainnya', icon: <Briefcase size={18} />, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-100' },
  spm_listrik: { label: 'SPM Listrik', icon: <Zap size={18} />, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-100' },
  
  spp_tunkin: { label: 'SPP Tunjangan Kinerja', icon: <DollarSign size={18} />, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100' },
  spp_lainnya: { label: 'SPP Lainnya', icon: <FileText size={18} />, color: 'text-slate-600', bgColor: 'bg-slate-50', borderColor: 'border-slate-100' },
  spp_gaji: { label: 'SPP Gaji Induk', icon: <Users size={18} />, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-100' },
  spp_makan: { label: 'SPP Uang Makan', icon: <UtensilsCrossed size={18} />, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-100' },
  spp_kontraktual: { label: 'SPP Kontraktual Lainnya', icon: <Briefcase size={18} />, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-100' },
  spp_listrik: { label: 'SPP Listrik', icon: <Zap size={18} />, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-100' },

  data_dukung: { label: 'Data Dukung', icon: <Paperclip size={18} />, color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-100' },
};

const PIE_COLORS = ['#f59e0b', '#0ea5e9', '#8b5cf6', '#f97316', '#f43f5e', '#10b981'];

export default function EArsip({ category = 'all' }: { category?: 'spm' | 'spp' | 'data_dukung' | 'all' }) {
  const [documents, setDocuments] = useState<ArsipDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<DocType | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<ArsipDocument | null>(null);
  const [activeTab, setActiveTab] = useState<'arsip' | 'statistik'>('arsip');

  useEffect(() => {
    setFilterType('all'); // Reset filter when category changes
  }, [category]);

  useEffect(() => {
    const q = query(collection(db, 'arsip'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ArsipDocument));
      docs.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      setDocuments(docs);
    });
    return unsubscribe;
  }, []);

  const filtered = documents.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.nomorSurat.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || d.type === filterType;
    const matchCategory = 
      category === 'all' || 
      (category === 'spm' && d.type.startsWith('spm')) || 
      (category === 'spp' && d.type.startsWith('spp')) || 
      (category === 'data_dukung' && d.type === 'data_dukung');
    return matchSearch && matchType && matchCategory;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus arsip ini?')) await deleteDoc(doc(db, 'arsip', id));
  };

  const totalNominal = documents.reduce((sum, d) => sum + (d.nominal || 0), 0);
  const typeStats = Object.keys(DOC_TYPE_CONFIG).map(key => ({
    name: DOC_TYPE_CONFIG[key as DocType].label,
    value: documents.filter(d => d.type === key).length,
    nominal: documents.filter(d => d.type === key).reduce((s, d) => s + (d.nominal || 0), 0),
  })).filter(s => s.value > 0);

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            {category === 'spm' ? 'ARKEUS : SPM' : category === 'spp' ? 'ARKEUS : SPP' : category === 'data_dukung' ? 'ARKEUS : Data Dukung' : 'ARKEUS : Arsip Keuangan Smart'}
          </h1>
          <p className="text-slate-500 mt-1 font-medium text-sm md:text-base">
            {category === 'spm' ? 'Manajemen Surat Perintah Membayar.' : category === 'spp' ? 'Manajemen Surat Permintaan Pembayaran.' : category === 'data_dukung' ? 'Manajemen Data Dukung Keuangan.' : 'Sistem Manajemen Arsip Keuangan Digital Terintegrasi.'}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 active:scale-95 w-full md:w-auto md:self-start text-sm">
          <Plus size={18} /> Tambah Arsip
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard icon={<FileText className="text-indigo-600" size={20} />} label="Total Arsip" value={filtered.length.toString()} color="bg-indigo-50" glow="glow-indigo" />
        {category !== 'data_dukung' && <StatCard icon={<DollarSign className="text-emerald-600" size={20} />} label="Total Nominal" value={`Rp ${filtered.reduce((sum, d) => sum + (d.nominal || 0), 0).toLocaleString('id-ID')}`} color="bg-emerald-50" />}
        {(category === 'all' || category === 'spm') && <StatCard icon={<Zap className="text-amber-600" size={20} />} label="Total SPM" value={documents.filter(d => d.type.startsWith('spm')).length.toString()} color="bg-amber-50" />}
        {(category === 'all' || category === 'spp') && <StatCard icon={<CreditCard className="text-emerald-600" size={20} />} label="Total SPP" value={documents.filter(d => d.type.startsWith('spp')).length.toString()} color="bg-emerald-50" />}
        {(category === 'all' || category === 'data_dukung') && <StatCard icon={<Paperclip className="text-violet-600" size={20} />} label="Data Dukung" value={documents.filter(d => d.type === 'data_dukung').length.toString()} color="bg-violet-50" />}
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-100 shadow-inner rounded-2xl w-fit border border-slate-200">
        <button onClick={() => setActiveTab('arsip')} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all", activeTab === 'arsip' ? "bg-white text-indigo-600 shadow-md border border-slate-100" : "text-slate-500")}>
          <Archive size={14} /> Daftar Arsip
        </button>
        <button onClick={() => setActiveTab('statistik')} className={cn("flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all", activeTab === 'statistik' ? "bg-white text-indigo-600 shadow-md border border-slate-100" : "text-slate-500")}>
          <BarChart3 size={14} /> Statistik
        </button>
      </div>

      {activeTab === 'statistik' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel p-8 rounded-[2rem] shadow-sm glow-indigo">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-8">Distribusi Dokumen</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeStats} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={6} dataKey="value" stroke="none">
                    {typeStats.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {typeStats.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="glass-panel p-8 rounded-[2rem] shadow-sm glow-indigo">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-8">Nominal per Kategori</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(v: number) => `${(v/1000000).toFixed(1)}jt`} />
                  <Tooltip formatter={(v: number) => `Rp ${v.toLocaleString('id-ID')}`} contentStyle={{ borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="nominal" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={32}>
                    {typeStats.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search & Quick Filters */}
          <div className="space-y-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input type="text" placeholder="Cari nomor surat, judul..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-slate-200 pl-11 pr-4 py-3.5 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none w-full transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400" />
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                <button onClick={() => setFilterType('all')}
                  className={cn("whitespace-nowrap px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border", 
                    filterType === 'all' ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300")}>
                  Semua
                </button>
                {Object.entries(DOC_TYPE_CONFIG)
                  .filter(([key]) => category === 'all' || (category === 'spm' && key.startsWith('spm')) || (category === 'spp' && key.startsWith('spp')) || (category === 'data_dukung' && key === 'data_dukung'))
                  .map(([key, cfg]) => (
                    <button key={key} onClick={() => setFilterType(key as DocType)}
                      className={cn("whitespace-nowrap px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2", 
                        filterType === key ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300")}>
                      {cfg.icon} {cfg.label.replace('SPM ', '').replace('SPP ', '')}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            <AnimatePresence>
              {filtered.map((d) => {
                const config = DOC_TYPE_CONFIG[d.type];
                return (
                  <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-white border border-slate-200 rounded-2xl p-4 active:bg-slate-50 transition-all shadow-sm"
                    onClick={() => setShowDetail(d)}>
                    <div className="flex items-start justify-between mb-3">
                      <span className={cn("inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border", config.color, config.bgColor, config.borderColor)}>
                        {config.icon} {config.label}
                      </span>
                      <div className="flex gap-1.5">
                        {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100"><Paperclip size={14} /></a>}
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }} className="p-2 bg-white border border-slate-100 text-slate-400 rounded-lg active:bg-rose-50 active:text-rose-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">{d.title}</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{d.nomorSurat}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 font-mono">{d.tanggal}</span>
                      {d.type !== 'data_dukung' && <span className="text-sm font-bold text-emerald-600">Rp {d.nominal.toLocaleString('id-ID')}</span>}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="p-12 text-center flex flex-col items-center bg-white rounded-2xl border border-slate-200">
                <Archive size={40} className="text-slate-200 mb-3" />
                <p className="text-slate-400 font-medium text-sm">Belum ada arsip.</p>
              </div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Tipe</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Judul / No. Surat</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Tanggal</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Nominal</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">File</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {filtered.map((d) => {
                      const config = DOC_TYPE_CONFIG[d.type];
                      return (
                        <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group hover:bg-slate-50 cursor-pointer transition-all" onClick={() => setShowDetail(d)}>
                          <td className="px-6 py-4"><span className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border", config.color, config.bgColor, config.borderColor)}>{config.icon} {config.label}</span></td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{d.title}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{d.nomorSurat}</p>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500 font-mono">{d.tanggal}</td>
                          <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">{d.type !== 'data_dukung' ? `Rp ${d.nominal.toLocaleString('id-ID')}` : '-'}</td>
                          <td className="px-6 py-4">{d.fileUrl ? <a href={d.fileUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-100"><Paperclip size={12} /> PDF</a> : <span className="text-slate-300 text-xs">-</span>}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={(e) => { e.stopPropagation(); setShowDetail(d); }} className="p-2.5 bg-white border border-slate-100 hover:border-indigo-200 hover:text-indigo-600 rounded-xl transition-all text-slate-400 shadow-sm"><Eye size={16} /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }} className="p-2.5 bg-white border border-slate-100 hover:border-rose-200 hover:text-rose-600 rounded-xl transition-all text-slate-400 shadow-sm"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="p-20 text-center flex flex-col items-center">
                <Archive size={48} className="text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">Belum ada arsip.</p>
              </div>
            )}
          </div>
        </>
      )}

      <AnimatePresence>{showForm && <AddArsipModal category={category} onClose={() => setShowForm(false)} />}</AnimatePresence>
      <AnimatePresence>{showDetail && <DetailModal document={showDetail} onClose={() => setShowDetail(null)} />}</AnimatePresence>
    </div>
  );
}

/* ======================== STAT CARD ======================== */
function StatCard({ icon, label, value, color, glow }: { icon: React.ReactNode; label: string; value: string; color: string; glow?: string }) {
  return (
    <div className={cn("glass-panel p-4 md:p-6 rounded-2xl md:rounded-3xl flex items-center justify-between shadow-sm", glow)}>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="text-lg md:text-2xl font-bold tracking-tight text-slate-900 truncate">{value}</p>
      </div>
      <div className={cn("p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/50 ml-2 shrink-0", color)}>
        {icon}
      </div>
    </div>
  );
}

/* ======================== ADD FORM MODAL ======================== */
function AddArsipModal({ onClose, category }: { onClose: () => void; category: string }) {
  const defaultType = category === 'spm' ? 'spm_tunkin' : category === 'spp' ? 'spp_tunkin' : category === 'data_dukung' ? 'data_dukung' : 'spm_tunkin';
  const [formData, setFormData] = useState({ type: defaultType as DocType, title: '', nomorSurat: '', tanggal: format(new Date(), 'yyyy-MM-dd'), nominal: 0, keterangan: '', periode: '' });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setUploadProgress(0);

    try {
      let fileUrl = '';
      let fileName = '';

      if (pdfFile) {
        const storageRef = ref(storage, `arsip/${Date.now()}_${pdfFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, pdfFile);

        fileUrl = await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            }, 
            (error) => reject(error), 
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });
        fileName = pdfFile.name;
      }

      await addDoc(collection(db, 'arsip'), { ...formData, fileUrl, fileName, createdAt: serverTimestamp() });
      onClose();
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      alert(`Gagal menyimpan: ${errMsg}`);
    } finally { 
      setSubmitting(false); 
      setUploadProgress(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.95 }}
        className="bg-white rounded-[2rem] p-8 w-full max-w-2xl border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tambah Arsip Baru</h2>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Tipe Dokumen *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(Object.entries(DOC_TYPE_CONFIG) as [DocType, typeof DOC_TYPE_CONFIG['spm_tunkin']][])
                .filter(([key]) => category === 'all' || (category === 'spm' && key.startsWith('spm')) || (category === 'spp' && key.startsWith('spp')) || (category === 'data_dukung' && key === 'data_dukung'))
                .map(([key, config]) => (
                <button key={key} type="button" onClick={() => setFormData({ ...formData, type: key })}
                  className={cn("flex items-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-[10px]",
                    formData.type === key ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-slate-200 text-slate-500 hover:border-slate-300")}>
                  {config.icon} {config.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Judul" icon={<FileText size={14} />} required>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none text-slate-900 font-bold placeholder:text-slate-400" placeholder="SPM Listrik Januari" />
            </InputField>
            <InputField label="Nomor Surat" icon={<FileText size={14} />} required>
              <input type="text" required value={formData.nomorSurat} onChange={(e) => setFormData({ ...formData, nomorSurat: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none font-mono text-slate-900 font-bold placeholder:text-slate-400" placeholder="SPM/001/2026" />
            </InputField>
            <InputField label="Tanggal" icon={<Calendar size={14} />} required>
              <input type="date" required value={formData.tanggal} onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none text-slate-900 font-bold" />
            </InputField>
            <InputField label="Periode" icon={<Clock size={14} />}>
              <input type="text" value={formData.periode} onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none text-slate-900 font-bold placeholder:text-slate-400" placeholder="Januari 2026" />
            </InputField>
          </div>
          {formData.type !== 'data_dukung' && (
            <InputField label="Nominal (Rp)" icon={<DollarSign size={14} />} required>
              <input type="number" required value={formData.nominal} onChange={(e) => setFormData({ ...formData, nominal: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none font-bold text-emerald-600" />
            </InputField>
          )}
          <InputField label="Keterangan" icon={<FileText size={14} />}>
            <textarea value={formData.keterangan} onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })} rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none text-slate-900 font-medium placeholder:text-slate-400 resize-none" placeholder="Keterangan..." />
          </InputField>
          {/* PDF Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold flex items-center gap-2 text-slate-400 uppercase tracking-[0.2em]"><Paperclip size={14} className="text-slate-300" /> Upload PDF</label>
            <label className={cn("flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all", pdfFile ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-slate-300 bg-slate-50")}>
              <Upload size={20} className={pdfFile ? "text-indigo-600" : "text-slate-400"} />
              <div className="flex-1">
                <p className={cn("font-bold text-sm", pdfFile ? "text-indigo-600" : "text-slate-500")}>{pdfFile ? pdfFile.name : "Pilih file PDF..."}</p>
                {pdfFile && <p className="text-[10px] text-slate-400 mt-0.5">{(pdfFile.size / 1024).toFixed(0)} KB</p>}
              </div>
              <input type="file" accept=".pdf" className="hidden" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-white hover:bg-slate-50 text-slate-500 rounded-2xl font-bold border border-slate-200 uppercase tracking-widest text-[11px]">Batal</button>
            <button type="submit" disabled={submitting} className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 disabled:opacity-70 transition-all relative overflow-hidden group">
              {submitting ? (
                <div className="flex flex-col items-center gap-1 w-full">
                  <span className="uppercase tracking-widest text-[10px]">
                    {uploadProgress !== null && uploadProgress < 100 ? `Mengirim... ${Math.round(uploadProgress)}%` : 'Menyimpan Data...'}
                  </span>
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden absolute bottom-0 left-0">
                    <motion.div 
                      className="h-full bg-white" 
                      initial={{ width: 0 }} 
                      animate={{ width: `${uploadProgress || 0}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 uppercase tracking-widest text-[11px]">
                  <Upload size={16} /> Simpan Arsip
                </div>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ======================== DETAIL MODAL ======================== */
function DetailModal({ document: doc, onClose }: { document: ArsipDocument; onClose: () => void }) {
  const config = DOC_TYPE_CONFIG[doc.type];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        className="bg-white rounded-[2rem] p-8 w-full max-w-lg border border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-8">
          <div className={cn("p-4 rounded-2xl border", config.bgColor, config.borderColor, config.color)}>
            {config.icon}
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">{doc.title}</h2>
        <span className={cn(
          "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border mb-8",
          config.color, config.bgColor, config.borderColor
        )}>
          {config.icon}
          {config.label}
        </span>

        <div className="space-y-4 bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <DetailRow label="Nomor Surat" value={doc.nomorSurat} />
          <DetailRow label="Tanggal" value={doc.tanggal} />
          <DetailRow label="Periode" value={doc.periode || '-'} />
          {doc.type !== 'data_dukung' && <DetailRow label="Nominal" value={`Rp ${doc.nominal.toLocaleString('id-ID')}`} highlight />}
          {doc.keterangan && <DetailRow label="Keterangan" value={doc.keterangan} />}
          {doc.fileUrl && (
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">File PDF</span>
              <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                <Paperclip size={12} /> {doc.fileName || 'Download PDF'}
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <span className={cn("font-bold text-sm", highlight ? "text-emerald-600" : "text-slate-700")}>{value}</span>
    </div>
  );
}

function InputField({ label, icon, children, required }: { label: string; icon: React.ReactNode; children: React.ReactNode; required?: boolean }) {
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
