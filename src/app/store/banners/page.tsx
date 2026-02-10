"use client";

import { useEffect, useState, useCallback } from "react";
import { storeApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    title: "", titleAr: "", titleKu: "", subtitle: "", subtitleAr: "", subtitleKu: "",
    gradientStart: "#3b82f6", gradientEnd: "#8b5cf6", discount: "",
    isActive: true, sortOrder: 0,
  });

  const load = useCallback(async () => {
    try { const res = await storeApi.getBanners(); setBanners(res.data.data || []); }
    catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", titleAr: "", titleKu: "", subtitle: "", subtitleAr: "", subtitleKu: "", gradientStart: "#3b82f6", gradientEnd: "#8b5cf6", discount: "", isActive: true, sortOrder: 0 });
    setShowModal(true);
  };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({
      title: b.title || "", titleAr: b.titleAr || "", titleKu: b.titleKu || "",
      subtitle: b.subtitle || "", subtitleAr: b.subtitleAr || "", subtitleKu: b.subtitleKu || "",
      gradientStart: b.gradientStart || "#3b82f6", gradientEnd: b.gradientEnd || "#8b5cf6",
      discount: b.discount || "", isActive: b.isActive !== false, sortOrder: b.sortOrder || 0,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) { await storeApi.updateBanner(editing.id, form); toast.success("Updated"); }
      else { await storeApi.createBanner(form); toast.success("Created"); }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    try { await storeApi.deleteBanner(id); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Store Banners</h1><p className="text-sm text-gray-400">{banners.length} banners</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Add Banner</button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {banners.map((b: any) => (
          <div key={b.id} className="overflow-hidden rounded-xl border border-gray-800">
            <div className="h-24 p-4" style={{ background: `linear-gradient(135deg, ${b.gradientStart || "#3b82f6"}, ${b.gradientEnd || "#8b5cf6"})` }}>
              <p className="text-lg font-bold text-white">{b.title}</p>
              {b.subtitle && <p className="text-sm text-white/80">{b.subtitle}</p>}
              {b.discount && <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">{b.discount}</span>}
            </div>
            <div className="flex items-center justify-between bg-gray-900 px-4 py-2">
              <div className="flex items-center gap-2">
                {b.isActive ? <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-xs text-green-400">Active</span> : <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-400">Inactive</span>}
                <span className="text-xs text-gray-500">Order: {b.sortOrder}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(b)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(b.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-600/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {banners.length === 0 && <p className="p-8 text-center text-gray-500">No banners</p>}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{editing ? "Edit Banner" : "Add Banner"}</h2><button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">Title (EN)</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">Title (AR)</label><input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" dir="rtl" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">Title (KU)</label><input value={form.titleKu} onChange={(e) => setForm({ ...form, titleKu: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" dir="rtl" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">Subtitle (EN)</label><input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">Subtitle (AR)</label><input value={form.subtitleAr} onChange={(e) => setForm({ ...form, subtitleAr: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" dir="rtl" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">Subtitle (KU)</label><input value={form.subtitleKu} onChange={(e) => setForm({ ...form, subtitleKu: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" dir="rtl" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">Gradient Start</label><input type="color" value={form.gradientStart} onChange={(e) => setForm({ ...form, gradientStart: e.target.value })} className="h-10 w-full rounded-lg border border-gray-700 bg-gray-800 px-1" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">Gradient End</label><input type="color" value={form.gradientEnd} onChange={(e) => setForm({ ...form, gradientEnd: e.target.value })} className="h-10 w-full rounded-lg border border-gray-700 bg-gray-800 px-1" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">Discount</label><input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
                <div><label className="mb-1 block text-xs text-gray-400">Sort Order</label><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="w-20 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              </div>
            </div>
            <div className="mt-5 flex gap-3"><button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800">Cancel</button><button onClick={handleSave} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
