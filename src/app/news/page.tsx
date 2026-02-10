"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { newsApi } from "@/lib/api";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, ImageIcon } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://sports-live.up.railway.app";

export default function NewsPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try { const res = await newsApi.getAll({ limit: 100 }); setArticles(res.data.data || []); }
    catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setTitle(""); setContent(""); setImageFile(null); setShowModal(true); };
  const openEdit = (a: any) => { setEditing(a); setTitle(a.title || ""); setContent(a.content || ""); setImageFile(null); setShowModal(true); };

  const handleSave = async () => {
    const fd = new FormData();
    fd.append("title", title);
    fd.append("content", content);
    if (imageFile) fd.append("image", imageFile);
    try {
      if (editing) { await newsApi.update(editing.id, fd); toast.success("Article updated"); }
      else { await newsApi.create(fd); toast.success("Article published"); }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    try { await newsApi.delete(id); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">News</h1><p className="text-sm text-gray-400">{articles.length} articles</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Publish Article</button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((a: any) => (
          <div key={a.id} className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
            {a.imageUrl ? (
              <img src={`${API_BASE}${a.imageUrl}`} alt="" className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 items-center justify-center bg-gray-800"><ImageIcon className="h-8 w-8 text-gray-600" /></div>
            )}
            <div className="p-4">
              <h3 className="mb-1 font-medium text-white line-clamp-2">{a.title}</h3>
              <p className="mb-2 text-xs text-gray-400 line-clamp-2">{a.content}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{a.author?.name}</span>
                  <span className="text-xs text-gray-600">{formatDateTime(a.createdAt)}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(a)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(a.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-600/10 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {articles.length === 0 && <p className="p-8 text-center text-gray-500">No articles</p>}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{editing ? "Edit Article" : "Publish Article"}</h2><button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs text-gray-400">Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              <div><label className="mb-1 block text-xs text-gray-400">Content</label><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none resize-none" /></div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Image</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 file:mr-3 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1 file:text-sm file:text-white" />
              </div>
            </div>
            <div className="mt-5 flex gap-3"><button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800">Cancel</button><button onClick={handleSave} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">{editing ? "Update" : "Publish"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
