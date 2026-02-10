"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { sliderApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, ImageIcon } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://sports-live.up.railway.app";

export default function SlidersPage() {
  const [sliders, setSliders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try { const res = await sliderApi.getAll(); setSliders(res.data.data || []); }
    catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setTitle(""); setLinkUrl(""); setIsActive(true); setSortOrder(0); setImageFile(null); setShowModal(true); };
  const openEdit = (s: any) => { setEditing(s); setTitle(s.title || ""); setLinkUrl(s.linkUrl || ""); setIsActive(s.isActive !== false); setSortOrder(s.sortOrder || 0); setImageFile(null); setShowModal(true); };

  const handleSave = async () => {
    const fd = new FormData();
    if (title) fd.append("title", title);
    if (linkUrl) fd.append("linkUrl", linkUrl);
    fd.append("isActive", String(isActive));
    fd.append("sortOrder", String(sortOrder));
    if (imageFile) fd.append("image", imageFile);
    try {
      if (editing) { await sliderApi.update(editing.id, fd); toast.success("Slider updated"); }
      else {
        if (!imageFile) { toast.error("Image is required"); return; }
        await sliderApi.create(fd); toast.success("Slider created");
      }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this slider?")) return;
    try { await sliderApi.delete(id); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Home Sliders</h1><p className="text-sm text-gray-400">{sliders.length} sliders</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Add Slider</button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sliders.map((s: any) => (
          <div key={s.id} className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
            {s.imageUrl ? (
              <img src={`${API_BASE}${s.imageUrl}`} alt="" className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 items-center justify-center bg-gray-800"><ImageIcon className="h-8 w-8 text-gray-600" /></div>
            )}
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">{s.title || "Untitled"}</p>
                <div className="flex items-center gap-2 mt-1">
                  {s.isActive ? <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-xs text-green-400">Active</span> : <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-400">Inactive</span>}
                  <span className="text-xs text-gray-500">Order: {s.sortOrder}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(s.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-600/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {sliders.length === 0 && <p className="p-8 text-center text-gray-500">No sliders</p>}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{editing ? "Edit Slider" : "Add Slider"}</h2><button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs text-gray-400">Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              <div><label className="mb-1 block text-xs text-gray-400">Link URL</label><input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Image {!editing && "(required)"}</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 file:mr-3 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1 file:text-sm file:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">Sort Order</label><input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div className="flex items-end pb-1"><label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label></div>
              </div>
            </div>
            <div className="mt-5 flex gap-3"><button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800">Cancel</button><button onClick={handleSave} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
