"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { storeApi } from "@/lib/api";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search, X, Upload, Image as ImageIcon } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://sports-live.up.railway.app";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    categoryId: "", name: "", nameAr: "", nameKu: "",
    description: "", descriptionAr: "", descriptionKu: "",
    price: 0, originalPrice: 0, discount: "",
    imageUrl: "", emoji: "📦", badge: "",
    colors: "", sizes: "",
    inStock: true, isFeatured: false, isActive: true, sortOrder: 0,
  });

  const load = useCallback(async () => {
    try {
      const [pRes, cRes] = await Promise.all([storeApi.getProducts(), storeApi.getCategories()]);
      setProducts(pRes.data.data || []);
      setCategories(cRes.data.data || []);
    } catch { toast.error("فشل التحميل"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setImageFile(null);
    setImagePreview("");
    setForm({ categoryId: "", name: "", nameAr: "", nameKu: "", description: "", descriptionAr: "", descriptionKu: "", price: 0, originalPrice: 0, discount: "", imageUrl: "", emoji: "📦", badge: "", colors: "", sizes: "", inStock: true, isFeatured: false, isActive: true, sortOrder: 0 });
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setImageFile(null);
    setImagePreview(p.imageUrl ? `${API_BASE}${p.imageUrl}` : "");
    const colorsStr = p.colors ? (typeof p.colors === "string" ? JSON.parse(p.colors) : p.colors).join(", ") : "";
    const sizesStr = p.sizes ? (typeof p.sizes === "string" ? JSON.parse(p.sizes) : p.sizes).join(", ") : "";
    setForm({
      categoryId: p.categoryId || "", name: p.name || "", nameAr: p.nameAr || "", nameKu: p.nameKu || "",
      description: p.description || "", descriptionAr: p.descriptionAr || "", descriptionKu: p.descriptionKu || "",
      price: p.price || 0, originalPrice: p.originalPrice || 0, discount: p.discount || "",
      imageUrl: p.imageUrl || "", emoji: p.emoji || "📦", badge: p.badge || "",
      colors: colorsStr, sizes: sizesStr,
      inStock: p.inStock !== false, isFeatured: p.isFeatured || false, isActive: p.isActive !== false, sortOrder: p.sortOrder || 0,
    });
    setShowModal(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    try {
      let imageUrl = form.imageUrl;

      if (imageFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append("image", imageFile);
        const uploadRes = await storeApi.uploadImage(fd);
        imageUrl = uploadRes.data.data.imageUrl;
        setUploading(false);
      }

      const colorsArr = form.colors ? form.colors.split(",").map((c: string) => c.trim()).filter(Boolean) : [];
      const sizesArr = form.sizes ? form.sizes.split(",").map((s: string) => s.trim()).filter(Boolean) : [];

      const payload = {
        ...form,
        imageUrl,
        colors: colorsArr.length > 0 ? colorsArr : undefined,
        sizes: sizesArr.length > 0 ? sizesArr : undefined,
      };

      if (editing) { await storeApi.updateProduct(editing.id, payload); toast.success("تم تحديث المنتج"); }
      else { await storeApi.createProduct(payload); toast.success("تم إنشاء المنتج"); }
      setShowModal(false); load();
    } catch (err: any) { setUploading(false); toast.error(err.response?.data?.message || "فشل"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا المنتج؟")) return;
    try { await storeApi.deleteProduct(id); toast.success("تم الحذف"); load(); }
    catch { toast.error("فشل"); }
  };

  const filtered = products.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.nameAr?.includes(search) || p.nameKu?.includes(search)
  );

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">المنتجات</h1><p className="text-sm text-gray-400">{products.length} منتج</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> إضافة منتج</button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2">
        <Search className="h-4 w-4 text-gray-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث عن المنتجات..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-500" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="px-4 py-3 text-right font-medium">المنتج</th>
              <th className="px-4 py-3 text-right font-medium">القسم</th>
              <th className="px-4 py-3 text-right font-medium">السعر</th>
              <th className="px-4 py-3 text-right font-medium">الحالة</th>
              <th className="px-4 py-3 text-left font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map((p: any) => (
              <tr key={p.id} className="hover:bg-gray-900/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.imageUrl ? (
                      <img src={`${API_BASE}${p.imageUrl}`} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <span className="text-xl">{p.emoji || "📦"}</span>
                    )}
                    <div>
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.nameAr}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400">{p.category?.name || "-"}</td>
                <td className="px-4 py-3">
                  <span className="font-medium text-white">{formatPrice(p.price)}</span>
                  {p.originalPrice > 0 && <span className="mr-2 text-xs text-gray-500 line-through">{formatPrice(p.originalPrice)}</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {p.isActive ? <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-xs text-green-400">نشط</span> : <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-400">غير نشط</span>}
                    {p.isFeatured && <span className="rounded-full bg-yellow-600/20 px-2 py-0.5 text-xs text-yellow-400">مميز</span>}
                    {!p.inStock && <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-xs text-red-400">نفد المخزون</span>}
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
        {filtered.length === 0 && <p className="p-8 text-center text-gray-500">لا توجد منتجات</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{editing ? "تعديل المنتج" : "إضافة منتج"}</h2><button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              {/* Image Upload */}
              <div>
                <label className="mb-1 block text-xs text-gray-400">صورة المنتج</label>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-gray-800 hover:border-blue-500 transition-colors overflow-hidden"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="h-5 w-5 text-gray-500" />
                        <span className="text-[10px] text-gray-500">رفع صورة</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  <div className="flex-1 text-xs text-gray-500">
                    <p>اضغط لاختيار صورة</p>
                    <p>PNG, JPG حتى 5MB</p>
                    {imageFile && <p className="mt-1 text-blue-400">{imageFile.name}</p>}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">القسم</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none">
                  <option value="">اختر القسم...</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">الاسم (EN)</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">الاسم (AR)</label><input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" dir="rtl" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">الاسم (KU)</label><input value={form.nameKu} onChange={(e) => setForm({ ...form, nameKu: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" dir="rtl" /></div>
              </div>
              {/* Descriptions */}
              <div><label className="mb-1 block text-xs text-gray-400">الوصف (EN)</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">الوصف (AR)</label><textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none resize-none" dir="rtl" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">الوصف (KU)</label><textarea value={form.descriptionKu} onChange={(e) => setForm({ ...form, descriptionKu: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none resize-none" dir="rtl" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">السعر</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">السعر الأصلي</label><input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">الخصم</label><input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="مثلاً 20%" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              </div>
              {/* Colors & Sizes */}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">الألوان (مفصولة بفاصلة)</label><input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="أحمر, أزرق, أسود" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">المقاسات (مفصولة بفاصلة)</label><input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="S, M, L, XL" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">الرمز</label><input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">الشارة</label><input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="مثلاً جديد، تخفيض" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} /> متوفر</label>
                <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> مميز</label>
                <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> نشط</label>
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
