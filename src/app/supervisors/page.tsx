"use client";

import { useEffect, useState, useCallback } from "react";
import { supervisorApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, X, Upload, Eye } from "lucide-react";

export default function SupervisorsPage() {
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", nationality: "", isActive: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await supervisorApi.getAll();
      setSupervisors(res.data.data || []);
    } catch {
      toast.error("فشل تحميل المشرفين");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", nationality: "", isActive: true });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ name: s.name || "", nationality: s.nationality || "", isActive: s.isActive ?? true });
    setImageFile(null);
    setImagePreview(s.imageUrl || null);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("يرجى إدخال اسم المشرف");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("nationality", form.nationality);
      formData.append("isActive", String(form.isActive));
      if (imageFile) formData.append("image", imageFile);

      if (editing) {
        await supervisorApi.update(editing.id, formData);
        toast.success("تم تحديث المشرف");
      } else {
        await supervisorApi.create(formData);
        toast.success("تم إنشاء المشرف");
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا المشرف؟")) return;
    try {
      await supervisorApi.delete(id);
      toast.success("تم الحذف");
      load();
    } catch {
      toast.error("فشل الحذف");
    }
  };

  const filtered = supervisors.filter((s: any) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">المشرفون</h1>
          <p className="text-sm text-gray-400">{supervisors.length} مشرف</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> إضافة مشرف
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2">
        <Search className="h-4 w-4 text-gray-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث عن مشرف..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-500" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((s: any) => (
          <div key={s.id} className="group relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-4 transition-colors hover:border-gray-700">
            <div className="mb-3 flex items-center gap-3">
              {s.imageUrl ? (
                <img src={s.imageUrl} alt={s.name} className="h-14 w-14 rounded-full object-cover border-2 border-gray-700" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-800 text-lg font-bold text-gray-400 border-2 border-gray-700">
                  {s.name?.charAt(0) || "؟"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{s.name}</p>
                {s.nationality && <p className="truncate text-xs text-gray-400">{s.nationality}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.isActive ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400"}`}>
                {s.isActive ? "نشط" : "غير نشط"}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(s.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-600/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <p className="mt-8 text-center text-gray-500">لا يوجد مشرفون</p>}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{editing ? "تعديل مشرف" : "إضافة مشرف"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              {/* Image Upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="h-24 w-24 rounded-full object-cover border-2 border-gray-700" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-800 border-2 border-dashed border-gray-600">
                      <Upload className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                  <label className="absolute -bottom-1 -left-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
                <p className="text-xs text-gray-500">اضغط لرفع صورة المشرف</p>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">الاسم *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم المشرف" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">الجنسية</label>
                <input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} placeholder="مثلاً: عراقي" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
              </div>

              {editing && (
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                  نشط
                </label>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800">إلغاء</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
