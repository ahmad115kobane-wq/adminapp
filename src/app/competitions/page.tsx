"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { adminApi, storeApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Trophy, X, Upload } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://sports-live.up.railway.app";

const COMP_TYPES: Record<string, string> = {
  football: "كرة قدم",
  basketball: "كرة سلة",
  futsal: "صالات",
  national: "منتخبات",
  women: "نسائية",
};

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: "", shortName: "", logoUrl: "", country: "", season: "", type: "football" });

  const load = useCallback(async () => {
    try { const res = await adminApi.getCompetitions(); setCompetitions(res.data.data || []); }
    catch { toast.error("فشل التحميل"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const getLogoSrc = (c: any) => {
    if (!c.logoUrl) return "";
    return c.logoUrl.startsWith("http") ? c.logoUrl : `${API_BASE}${c.logoUrl}`;
  };

  const openCreate = () => {
    setEditing(null);
    setLogoFile(null);
    setLogoPreview("");
    setForm({ name: "", shortName: "", logoUrl: "", country: "", season: "", type: "football" });
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setLogoFile(null);
    setLogoPreview(c.logoUrl ? getLogoSrc(c) : "");
    setForm({ name: c.name || "", shortName: c.shortName || "", logoUrl: c.logoUrl || "", country: c.country || "", season: c.season || "", type: c.type || "football" });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      let logoUrl = form.logoUrl;
      if (logoFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append("image", logoFile);
        const uploadRes = await storeApi.uploadImage(fd);
        logoUrl = uploadRes.data.data.imageUrl;
        setUploading(false);
      }
      const payload = { ...form, logoUrl };
      if (editing) { await adminApi.updateCompetition(editing.id, payload); toast.success("تم تحديث البطولة"); }
      else { await adminApi.createCompetition(payload); toast.success("تم إنشاء البطولة"); }
      setShowModal(false); load();
    } catch (err: any) { setUploading(false); toast.error(err.response?.data?.message || "فشل"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذه البطولة؟")) return;
    try { await adminApi.deleteCompetition(id); toast.success("تم الحذف"); load(); }
    catch { toast.error("فشل الحذف"); }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">البطولات</h1><p className="text-sm text-gray-400">{competitions.length} بطولة</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> إنشاء بطولة</button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {competitions.map((c: any) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4">
            <div className="flex items-center gap-3">
              {getLogoSrc(c) ? <img src={getLogoSrc(c)} alt="" className="h-10 w-10 rounded-lg object-contain" /> : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800"><Trophy className="h-5 w-5 text-gray-500" /></div>}
              <div>
                <p className="font-medium text-white">{c.name}</p>
                <p className="text-xs text-gray-400">{COMP_TYPES[c.type] || c.type || "كرة قدم"} · {c.country || "غير محدد"} · {c.season || "غير محدد"}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(c.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-600/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
      {competitions.length === 0 && <p className="p-8 text-center text-gray-500">لا توجد بطولات</p>}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{editing ? "تعديل البطولة" : "إنشاء بطولة"}</h2><button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              {/* Logo Upload */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">شعار البطولة</label>
                <div className="flex items-center gap-4">
                  <div onClick={() => logoRef.current?.click()} className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-gray-800 hover:border-blue-500 transition-colors overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="" className="h-full w-full object-contain p-1" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="h-5 w-5 text-gray-500" />
                        <span className="text-[10px] text-gray-500">رفع شعار</span>
                      </div>
                    )}
                  </div>
                  <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                  <div className="flex-1 text-xs text-gray-500">
                    <p>اضغط لرفع شعار البطولة</p>
                    <p>PNG, JPG, SVG</p>
                    {logoFile && <p className="mt-1 text-blue-400">{logoFile.name}</p>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">الاسم</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">الاسم المختصر</label><input value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">النوع</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none">
                  {Object.entries(COMP_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">الدولة</label><input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">الموسم</label><input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} placeholder="مثلاً 2024-2025" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800">إلغاء</button>
              <button onClick={handleSave} disabled={uploading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {uploading ? "جاري الرفع..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
