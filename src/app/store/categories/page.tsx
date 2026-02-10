"use client";

import { useEffect, useState, useCallback } from "react";
import { storeApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", nameAr: "", nameKu: "", icon: "grid", sortOrder: 0, isActive: true });

  const load = useCallback(async () => {
    try { const res = await storeApi.getCategories(); setCategories(res.data.data || []); }
    catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ name: "", nameAr: "", nameKu: "", icon: "grid", sortOrder: 0, isActive: true }); setShowModal(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name || "", nameAr: c.nameAr || "", nameKu: c.nameKu || "", icon: c.icon || "grid", sortOrder: c.sortOrder || 0, isActive: c.isActive !== false }); setShowModal(true); };

  const handleSave = async () => {
    try {
      if (editing) { await storeApi.updateCategory(editing.id, form); toast.success("Updated"); }
      else { await storeApi.createCategory(form); toast.success("Created"); }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try { await storeApi.deleteCategory(id); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Store Categories</h1><p className="text-sm text-gray-400">{categories.length} categories</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Add Category</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Arabic</th>
              <th className="px-4 py-3 text-left font-medium">Kurdish</th>
              <th className="px-4 py-3 text-left font-medium">Products</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {categories.map((c: any) => (
              <tr key={c.id} className="hover:bg-gray-900/50">
                <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                <td className="px-4 py-3 text-gray-400" dir="rtl">{c.nameAr}</td>
                <td className="px-4 py-3 text-gray-400" dir="rtl">{c.nameKu}</td>
                <td className="px-4 py-3 text-gray-400">{c.productCount || 0}</td>
                <td className="px-4 py-3">{c.isActive ? <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-xs text-green-400">Active</span> : <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-400">Inactive</span>}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-600/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && <p className="p-8 text-center text-gray-500">No categories</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{editing ? "Edit Category" : "Add Category"}</h2><button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs text-gray-400">Name (EN)</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              <div><label className="mb-1 block text-xs text-gray-400">Name (AR)</label><input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" dir="rtl" /></div>
              <div><label className="mb-1 block text-xs text-gray-400">Name (KU)</label><input value={form.nameKu} onChange={(e) => setForm({ ...form, nameKu: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" dir="rtl" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">Icon</label><input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">Sort Order</label><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
            </div>
            <div className="mt-5 flex gap-3"><button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800">Cancel</button><button onClick={handleSave} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
