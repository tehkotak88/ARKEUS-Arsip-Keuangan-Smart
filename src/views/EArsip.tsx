import React, { useState, useEffect } from 'react';
import {
  Archive,
  Plus,
  Search,
  Filter,
  Zap,
  Receipt,
  Calendar,
  DollarSign,
  FileText,
  Trash2,
  Eye,
  X,
  Upload,
  Download,
  Clock
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

type DocType = 'spm_listrik' | 'kwitansi';

interface ArsipDocument {
  id: string;
  type: DocType;
  title: string;
  nomorSurat: string;
  tanggal: string;
  nominal: number;
  keterangan: string;
  periode: string;
  createdAt: any;
}

const DOC_TYPE_CONFIG: Record<DocType, { label: string; icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  spm_listrik: {
    label: 'SPM Listrik',
    icon: <Zap size={18} />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-100',
  },
  kwitansi: {
    label: 'Kwitansi',
    icon: <Receipt size={18} />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100',
  },
};

export default function EArsip() {
  const [documents, setDocuments] = useState<ArsipDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<DocType | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<ArsipDocument | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'arsip'), orderBy('tanggal', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDocuments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ArsipDocument)));
    }, (error) => {
      // Fallback if index not ready - query without orderBy
      console.warn('Index not ready, falling back:', error);
      const fallbackQ = query(collection(db, 'arsip'));
      onSnapshot(fallbackQ, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ArsipDocument));
        docs.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
        setDocuments(docs);
      });
    });
    return unsubscribe;
  }, []);

  const filtered = documents.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.nomorSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.keterangan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || d.type === filterType;
    return matchSearch && matchType;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus arsip ini?')) {
      await deleteDoc(doc(db, 'arsip', id));
    }
  };

  const totalSPM = documents.filter(d => d.type === 'spm_listrik').length;
  const totalKwitansi = documents.filter(d => d.type === 'kwitansi').length;
  const totalNominal = documents.reduce((sum, d) => sum + (d.nominal || 0), 0);

  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">E-Arsip Keuangan</h1>
          <p className="text-slate-500 mt-1 font-medium">Kelola arsip SPM Listrik & Kwitansi secara digital.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30"
        >
          <Plus size={18} />
          Tambah Arsip
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Zap className="text-amber-600" size={24} />}
          label="SPM Listrik"
          value={totalSPM.toString()}
          color="bg-amber-50"
        />
        <StatCard
          icon={<Receipt className="text-emerald-600" size={24} />}
          label="Kwitansi"
          value={totalKwitansi.toString()}
          color="bg-emerald-50"
        />
        <StatCard
          icon={<DollarSign className="text-indigo-600" size={24} />}
          label="Total Nominal"
          value={`Rp ${totalNominal.toLocaleString('id-ID')}`}
          color="bg-indigo-50"
          glow="glow-indigo"
        />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Cari nomor surat, judul, keterangan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border border-slate-200 pl-11 pr-4 py-3.5 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none w-full transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          {(['all', 'spm_listrik', 'kwitansi'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all",
                filterType === type
                  ? "bg-white text-indigo-600 shadow-md border border-slate-100"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {type === 'all' ? 'Semua' : DOC_TYPE_CONFIG[type].label}
            </button>
          ))}
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm glow-indigo">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Tipe</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Judul / No. Surat</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Tanggal</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Periode</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Nominal</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {filtered.map((doc) => {
                  const config = DOC_TYPE_CONFIG[doc.type];
                  return (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group hover:bg-slate-50 cursor-pointer transition-all"
                      onClick={() => setShowDetail(doc)}
                    >
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border",
                          config.color, config.bgColor, config.borderColor
                        )}>
                          {config.icon}
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{doc.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{doc.nomorSurat}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-mono">{doc.tanggal}</td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-bold text-slate-600 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                          {doc.periode || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">
                        Rp {doc.nominal.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowDetail(doc); }}
                            className="p-2.5 bg-white border border-slate-100 hover:border-indigo-200 hover:text-indigo-600 rounded-xl transition-all text-slate-400 shadow-sm"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                            className="p-2.5 bg-white border border-slate-100 hover:border-rose-200 hover:text-rose-600 rounded-xl transition-all text-slate-400 shadow-sm"
                          >
                            <Trash2 size={16} />
                          </button>
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
            <p className="text-slate-400 font-medium">Belum ada arsip. Klik "Tambah Arsip" untuk memulai.</p>
          </div>
        )}
      </div>

      {/* Add Form Modal */}
      <AnimatePresence>
        {showForm && (
          <AddArsipModal onClose={() => setShowForm(false)} />
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail && (
          <DetailModal document={showDetail} onClose={() => setShowDetail(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ======================== STAT CARD ======================== */
function StatCard({ icon, label, value, color, glow }: { icon: React.ReactNode; label: string; value: string; color: string; glow?: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn("bg-white border border-slate-200 p-6 rounded-3xl flex items-center justify-between shadow-sm", glow)}
    >
      <div>
        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      </div>
      <div className={cn("p-4 rounded-2xl border border-white/50", color)}>
        {icon}
      </div>
    </motion.div>
  );
}

/* ======================== ADD FORM MODAL ======================== */
function AddArsipModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    type: 'spm_listrik' as DocType,
    title: '',
    nomorSurat: '',
    tanggal: format(new Date(), 'yyyy-MM-dd'),
    nominal: 0,
    keterangan: '',
    periode: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'arsip'), {
        ...formData,
        createdAt: serverTimestamp(),
      });
      onClose();
    } catch (error) {
      console.error('Error saving arsip:', error);
      alert('Gagal menyimpan arsip.');
    } finally {
      setSubmitting(false);
    }
  };

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
        className="bg-white rounded-[2rem] p-8 w-full max-w-2xl border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tambah Arsip Baru</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Isi data dokumen keuangan.</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold flex items-center gap-2 text-slate-400 uppercase tracking-[0.2em]">
              <FileText size={14} className="text-slate-300" /> Tipe Dokumen <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(DOC_TYPE_CONFIG) as [DocType, typeof DOC_TYPE_CONFIG['spm_listrik']][]).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: key })}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-sm",
                    formData.type === key
                      ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  )}
                >
                  {config.icon}
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Judul Dokumen"
              icon={<FileText size={14} />}
              required
            >
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all text-slate-900 font-bold placeholder:text-slate-400"
                placeholder="SPM Listrik Bulan Januari"
              />
            </InputField>

            <InputField
              label="Nomor Surat"
              icon={<FileText size={14} />}
              required
            >
              <input
                type="text"
                required
                value={formData.nomorSurat}
                onChange={(e) => setFormData({ ...formData, nomorSurat: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all font-mono text-slate-900 font-bold placeholder:text-slate-400"
                placeholder="SPM/001/2026"
              />
            </InputField>

            <InputField
              label="Tanggal"
              icon={<Calendar size={14} />}
              required
            >
              <input
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all text-slate-900 font-bold"
              />
            </InputField>

            <InputField
              label="Periode"
              icon={<Clock size={14} />}
            >
              <input
                type="text"
                value={formData.periode}
                onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all text-slate-900 font-bold placeholder:text-slate-400"
                placeholder="Januari 2026"
              />
            </InputField>
          </div>

          <InputField
            label="Nominal (Rp)"
            icon={<DollarSign size={14} />}
            required
          >
            <input
              type="number"
              required
              value={formData.nominal}
              onChange={(e) => setFormData({ ...formData, nominal: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all font-bold text-emerald-600"
            />
          </InputField>

          <InputField
            label="Keterangan"
            icon={<FileText size={14} />}
          >
            <textarea
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400 resize-none"
              placeholder="Keterangan tambahan..."
            />
          </InputField>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-white hover:bg-slate-50 text-slate-500 rounded-2xl font-bold transition-all border border-slate-200 shadow-sm uppercase tracking-widest text-[11px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 disabled:opacity-50 transition-all uppercase tracking-widest text-[11px]"
            >
              {submitting ? 'Menyimpan...' : (
                <>
                  <Upload size={16} />
                  Simpan Arsip
                </>
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
            {doc.type === 'spm_listrik' ? <Zap size={28} /> : <Receipt size={28} />}
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
          <DetailRow label="Nominal" value={`Rp ${doc.nominal.toLocaleString('id-ID')}`} highlight />
          {doc.keterangan && <DetailRow label="Keterangan" value={doc.keterangan} />}
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
