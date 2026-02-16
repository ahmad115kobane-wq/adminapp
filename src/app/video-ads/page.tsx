"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { videoAdApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Video, Eye, Clock } from "lucide-react";

export default function VideoAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [clickUrl, setClickUrl] = useState("");
  const [mandatorySeconds, setMandatorySeconds] = useState("5");
  const [isActive, setIsActive] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await videoAdApi.getAll();
      setAds(res.data.data || []);
    } catch {
      toast.error("فشل تحميل الإعلانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setClickUrl("");
    setMandatorySeconds("5");
    setIsActive(true);
    setVideoFile(null);
    setThumbnailFile(null);
    setShowModal(true);
  };

  const openEdit = (ad: any) => {
    setEditing(ad);
    setTitle(ad.title || "");
    setClickUrl(ad.clickUrl || "");
    setMandatorySeconds(String(ad.mandatorySeconds || 5));
    setIsActive(ad.isActive !== false);
    setVideoFile(null);
    setThumbnailFile(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editing && !videoFile) {
      toast.error("ملف الفيديو مطلوب");
      return;
    }
    setSaving(true);
    const fd = new FormData();
    fd.append("title", title || "إعلان بدون عنوان");
    fd.append("mandatorySeconds", String(Number(mandatorySeconds) || 5));
    fd.append("isActive", String(isActive));
    if (clickUrl) fd.append("clickUrl", clickUrl);
    if (videoFile) fd.append("video", videoFile);
    if (thumbnailFile) fd.append("thumbnail", thumbnailFile);

    try {
      if (editing) {
        await videoAdApi.update(editing.id, fd);
        toast.success("تم تحديث الإعلان");
      } else {
        await videoAdApi.create(fd);
        toast.success("تم إنشاء الإعلان");
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
    if (!confirm("حذف هذا الإعلان؟")) return;
    try {
      await videoAdApi.delete(id);
      toast.success("تم الحذف");
      load();
    } catch {
      toast.error("فشل الحذف");
    }
  };

  const toggleActive = async (ad: any) => {
    const fd = new FormData();
    fd.append("isActive", String(!ad.isActive));
    try {
      await videoAdApi.update(ad.id, fd);
      toast.success(ad.isActive ? "تم إيقاف الإعلان" : "تم تفعيل الإعلان");
      load();
    } catch {
      toast.error("فشل التحديث");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">إعلانات الفيديو</h1>
          <p className="text-sm text-gray-400">
            {ads.length} إعلان — يظهر إعلان عشوائي عند فتح التطبيق
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> إضافة إعلان
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ads.map((ad: any) => (
          <div
            key={ad.id}
            className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900"
          >
            <div className="flex h-40 items-center justify-center bg-gray-800">
              <Video className="h-12 w-12 text-gray-600" />
            </div>
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-white">{ad.title}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {ad.mandatorySeconds}ث إجباري
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {ad.views} مشاهدة
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={() => toggleActive(ad)}
                  className={`rounded-full px-2.5 py-0.5 text-xs ${
                    ad.isActive
                      ? "bg-green-600/20 text-green-400"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {ad.isActive ? "نشط" : "غير نشط"}
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(ad)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ad.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-600/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {ads.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-700 p-12">
          <Video className="mb-3 h-12 w-12 text-gray-600" />
          <p className="text-gray-400">لا توجد إعلانات فيديو</p>
          <p className="mt-1 text-xs text-gray-500">أضف إعلان فيديو ليظهر للمستخدمين عند فتح التطبيق</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {editing ? "تعديل الإعلان" : "إضافة إعلان فيديو"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">العنوان</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="اسم الإعلان"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">
                  ملف الفيديو (MP4) {!editing && "(مطلوب)"}
                </label>
                <input
                  ref={videoRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 file:mr-3 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1 file:text-sm file:text-white"
                />
                <p className="mt-1 text-xs text-gray-500">الحد الأقصى 50 ميجا — يفضل MP4 مضغوط</p>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">
                  صورة مصغرة (اختياري)
                </label>
                <input
                  ref={thumbRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 file:mr-3 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1 file:text-sm file:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">
                  رابط عند النقر (اختياري)
                </label>
                <input
                  value={clickUrl}
                  onChange={(e) => setClickUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">
                    الوقت الإجباري (ثانية)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={mandatorySeconds}
                    onChange={(e) => setMandatorySeconds(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />{" "}
                    نشط
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
