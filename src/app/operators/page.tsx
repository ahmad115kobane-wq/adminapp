"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, UserCog, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function OperatorsPage() {
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const load = useCallback(async () => {
    try { const res = await adminApi.getOperators(); setOperators(res.data.data || []); }
    catch { toast.error("فشل التحميل"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    try { await adminApi.createOperator(form); toast.success("تم إنشاء المشغل"); setShowModal(false); setForm({ name: "", email: "", password: "" }); load(); }
    catch (err: any) { toast.error(err.response?.data?.message || "فشل"); }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">المشغلون</h1><p className="text-sm text-gray-400">{operators.length} مشغل</p></div>
        <button onClick={() => { setForm({ name: "", email: "", password: "" }); setShowModal(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> إنشاء مشغل</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="px-4 py-3 text-right font-medium">المشغل</th>
              <th className="px-4 py-3 text-right font-medium">تاريخ الإنشاء</th>
              <th className="px-4 py-3 text-right font-medium">المباريات المعينة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {operators.map((op: any) => (
              <tr key={op.id} className="hover:bg-gray-900/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600/20"><UserCog className="h-4 w-4 text-purple-400" /></div>
                    <div><p className="font-medium text-white">{op.name}</p><p className="text-xs text-gray-400">{op.email}</p></div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400">{formatDate(op.createdAt)}</td>
                <td className="px-4 py-3 text-gray-400">{op.operatorMatches?.length || 0} مباراة</td>
              </tr>
            ))}
          </tbody>
        </table>
        {operators.length === 0 && <p className="p-8 text-center text-gray-500">لا يوجد مشغلون</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">إنشاء مشغل</h2><button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs text-gray-400">الاسم</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              <div><label className="mb-1 block text-xs text-gray-400">البريد الإلكتروني</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              <div><label className="mb-1 block text-xs text-gray-400">كلمة المرور</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
            </div>
            <div className="mt-5 flex gap-3"><button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800">إلغاء</button><button onClick={handleCreate} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">إنشاء</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
