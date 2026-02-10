"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Trophy, X } from "lucide-react";

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", logoUrl: "", country: "", season: "" });

  const load = useCallback(async () => {
    try { const res = await adminApi.getCompetitions(); setCompetitions(res.data.data || []); }
    catch { toast.error("فشل التحميل"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", logoUrl: "", country: "", season: "" });
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name || "", logoUrl: c.logoUrl || "", country: c.country || "", season: c.season || "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) { await adminApi.updateCompetition(editing.id, form); toast.success("تم تحديث المسابقة"); }
      else { await adminApi.createCompetition(form); toast.success("تم إنشاء المسابقة"); }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err.response?.data?.message || "فشل"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذه المسابقة؟")) return;
    try { await adminApi.deleteCompetition(id); toast.success("تم الحذف"); load(); }
    catch { toast.error("فشل الحذف"); }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">المسابقات</h1><p className="text-sm text-gray-400">{competitions.length} مسابقة</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> إنشاء</button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {competitions.map((c: any) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4">
            <div className="flex items-center gap-3">
              {c.logoUrl ? <img src={c.logoUrl} alt="" className="h-10 w-10 rounded-lg object-contain" /> : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800"><Trophy className="h-5 w-5 text-gray-500" /></div>}
              <div><p className="font-medium text-white">{c.name}</p><p className="text-xs text-gray-400">{c.country || "N/A"} · {c.season || "N/A"}</p></div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(c.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-600/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
      {competitions.length === 0 && <p className="p-8 text-center text-gray-500">لا توجد مسابقات</p>}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{editing ? "تعديل المسابقة" : "إنشاء مسابقة"}</h2><button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              {[["name","الاسم"],["logoUrl","رابط الشعار"],["country","الدولة"],["season","الموسم"]].map(([key, label]) => (
                <div key={key}><label className="mb-1 block text-xs text-gray-400">{label}</label><input value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              ))}
            </div>
            <div className="mt-5 flex gap-3"><button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800">إلغاء</button><button onClick={handleSave} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">حفظ</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
