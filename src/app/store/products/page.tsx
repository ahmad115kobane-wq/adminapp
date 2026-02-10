"use client";

import { useEffect, useState, useCallback } from "react";
import { storeApi } from "@/lib/api";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    categoryId: "", name: "", nameAr: "", nameKu: "",
    description: "", descriptionAr: "", descriptionKu: "",
    price: 0, originalPrice: 0, discount: "",
    emoji: "📦", badge: "", inStock: true, isFeatured: false, isActive: true, sortOrder: 0,
  });

  const load = useCallback(async () => {
    try {
      const [pRes, cRes] = await Promise.all([storeApi.getProducts(), storeApi.getCategories()]);
      setProducts(pRes.data.data || []);
      setCategories(cRes.data.data || []);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ categoryId: "", name: "", nameAr: "", nameKu: "", description: "", descriptionAr: "", descriptionKu: "", price: 0, originalPrice: 0, discount: "", emoji: "📦", badge: "", inStock: true, isFeatured: false, isActive: true, sortOrder: 0 });
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      categoryId: p.categoryId || "", name: p.name || "", nameAr: p.nameAr || "", nameKu: p.nameKu || "",
      description: p.description || "", descriptionAr: p.descriptionAr || "", descriptionKu: p.descriptionKu || "",
      price: p.price || 0, originalPrice: p.originalPrice || 0, discount: p.discount || "",
      emoji: p.emoji || "📦", badge: p.badge || "", inStock: p.inStock !== false, isFeatured: p.isFeatured || false, isActive: p.isActive !== false, sortOrder: p.sortOrder || 0,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) { await storeApi.updateProduct(editing.id, form); toast.success("Product updated"); }
      else { await storeApi.createProduct(form); toast.success("Product created"); }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try { await storeApi.deleteProduct(id); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  const filtered = products.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.nameAr?.includes(search) || p.nameKu?.includes(search)
  );

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Products</h1><p className="text-sm text-gray-400">{products.length} products</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Add Product</button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2">
        <Search className="h-4 w-4 text-gray-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-500" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Product</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Price</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map((p: any) => (
              <tr key={p.id} className="hover:bg-gray-900/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{p.emoji || "📦"}</span>
                    <div>
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.nameAr}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400">{p.category?.name || "-"}</td>
                <td className="px-4 py-3">
                  <span className="font-medium text-white">{formatPrice(p.price)}</span>
                  {p.originalPrice > 0 && <span className="ml-2 text-xs text-gray-500 line-through">{formatPrice(p.originalPrice)}</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {p.isActive ? <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-xs text-green-400">Active</span> : <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-400">Inactive</span>}
                    {p.isFeatured && <span className="rounded-full bg-yellow-600/20 px-2 py-0.5 text-xs text-yellow-400">Featured</span>}
                    {!p.inStock && <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-xs text-red-400">Out of stock</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-600/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-8 text-center text-gray-500">No products found</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{editing ? "Edit Product" : "Add Product"}</h2><button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Category</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none">
                  <option value="">Select category...</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">Name (EN)</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">Name (AR)</label><input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" dir="rtl" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">Name (KU)</label><input value={form.nameKu} onChange={(e) => setForm({ ...form, nameKu: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" dir="rtl" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">Price</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">Original Price</label><input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">Discount</label><input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="e.g. 20%" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">Emoji</label><input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">Badge</label><input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="e.g. New, Sale" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} /> In Stock</label>
                <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured</label>
                <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
              </div>
            </div>
            <div className="mt-5 flex gap-3"><button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800">Cancel</button><button onClick={handleSave} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
