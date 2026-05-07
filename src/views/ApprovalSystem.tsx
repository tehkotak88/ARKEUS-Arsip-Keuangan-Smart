import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Clock, 
  ThumbsUp,
  ThumbsDown,
  Award,
  TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDateString, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface ApprovalRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'pangkat' | 'kgb';
  newValue: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  processedDate?: string;
  reason?: string;
}

export default function ApprovalSystem() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('approvals')
      .select('*');
    
    if (data) setRequests(data as ApprovalRequest[]);
    if (error) console.error('Error fetching requests:', error);
  };

  useEffect(() => {
    fetchRequests();

    const subscription = supabase
      .channel('approval-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleProcess = async (request: ApprovalRequest, status: 'approved' | 'rejected') => {
    try {
      if (status === 'approved') {
        const { data: empData, error: empError } = await supabase
          .from('employees')
          .select('*')
          .eq('id', request.employeeId)
          .single();
        
        if (empData) {
          const today = format(new Date(), 'yyyy-MM-dd');
          
          // Add to History
          const { error: histError } = await supabase
            .from('history')
            .insert([{
              employeeId: request.employeeId,
              type: request.type,
              date: today,
              value: request.newValue,
              note: `Disetujui melalui sistem pada ${today}`
            }]);
          if (histError) throw histError;

          // Update Employee Milestone
          const updates: any = { updatedAt: new Date().toISOString() };
          if (request.type === 'pangkat') {
            updates.lastPangkatDate = today;
            updates.currentRank = request.newValue === 'Pangkat Selanjutnya' ? empData.currentRank : request.newValue;
          } else {
            updates.lastKgbDate = today;
          }
          const { error: updateError } = await supabase
            .from('employees')
            .update(updates)
            .eq('id', request.employeeId);
          if (updateError) throw updateError;
        }
        if (empError) throw empError;
      }

      const { error: processError } = await supabase
        .from('approvals')
        .update({
          status,
          processedDate: new Date().toISOString(),
        })
        .eq('id', request.id);
      
      if (processError) throw processError;

      alert(`Permohonan ${status === 'approved' ? 'disetujui' : 'ditolak'}.`);
    } catch (error: any) {
      console.error(error);
      alert('Gagal memproses permohonan: ' + error.message);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const pastRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Sistem Persetujuan</h1>
        <p className="text-slate-500 font-medium tracking-wide">Persetujuan otomatis & verifikasi dokumen.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Menunggu Persetujuan ({pendingRequests.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {pendingRequests.map(req => (
              <motion.div 
                key={req.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <RequestCard 
                  request={req} 
                  onApprove={() => handleProcess(req, 'approved')} 
                  onReject={() => handleProcess(req, 'rejected')} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {pendingRequests.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-3xl">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                <Check className="text-emerald-500" size={32} />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Semua permohonan telah diproses</p>
            </div>
          )}
        </div>
      </section>

      {pastRequests.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Riwayat Persetujuan Terkini</h2>
          <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
             <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Pegawai</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Tipe</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Status</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Tanggal Permohonan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pastRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{req.employeeName}</td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-slate-500 font-bold text-[11px] uppercase tracking-wider">{req.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                          req.status === 'approved' 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-rose-50 text-rose-600 border-rose-100"
                        )}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-bold font-mono text-[10px] text-right">
                        {req.requestDate ? formatDateString(req.requestDate) : '...'}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </section>
      )}
    </div>
  );
}

function RequestCard({ request, onApprove, onReject }: { request: ApprovalRequest, onApprove: () => void, onReject: () => void }) {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-[2rem] flex flex-col h-full group hover:border-indigo-200 transition-all duration-500 shadow-sm hover:shadow-md">
      <div className="flex items-start justify-between mb-6">
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
          {request.type === 'pangkat' ? <Award size={24} /> : <TrendingUp size={24} />}
        </div>
        <div className="flex items-center gap-2 text-amber-600 text-[10px] font-bold uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
          <Clock size={12} /> Pending
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div>
          <h3 className="font-bold text-xl leading-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
            {request.employeeName}
          </h3>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Pengajuan {request.type === 'pangkat' ? 'Pangkat & Golongan' : 'Gaji Berkala (KGB)'}
          </p>
        </div>
        
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400 font-bold uppercase tracking-widest">Target Nilai Baru</span>
            <span className="font-bold text-slate-700">{request.newValue}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400 font-bold uppercase tracking-widest">Waktu Pengajuan</span>
            <span className="font-bold font-mono text-slate-500 text-[10px]">
                {request.requestDate ? formatDateString(request.requestDate) : '...'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button 
          onClick={onReject}
          className="flex-1 py-3.5 flex items-center justify-center gap-2 text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all shadow-sm"
        >
          <ThumbsDown size={14} /> Tolak
        </button>
        <button 
          onClick={onApprove}
          className="flex-1 py-3.5 flex items-center justify-center gap-2 text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all"
        >
          <ThumbsUp size={14} /> Setujui
        </button>
      </div>
    </div>
  );
}
