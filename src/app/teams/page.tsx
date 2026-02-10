"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { teamApi, adminApi, storeApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Users, X, ChevronDown, ChevronUp, Upload, Shield } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://sports-live.up.railway.app";

const TEAM_COLORS = [
  { value: "#DC2626", label: "أحمر" },
  { value: "#1E3A8A", label: "أزرق داكن" },
  { value: "#2563EB", label: "أزرق" },
  { value: "#16A34A", label: "أخضر" },
  { value: "#FACC15", label: "أصفر" },
  { value: "#F97316", label: "برتقالي" },
  { value: "#7C3AED", label: "بنفسجي" },
  { value: "#000000", label: "أسود" },
  { value: "#FFFFFF", label: "أبيض" },
  { value: "#92400E", label: "بني" },
  { value: "#EC4899", label: "وردي" },
  { value: "#0891B2", label: "سماوي" },
];

const CATEGORIES: Record<string, string> = {
  FOOTBALL: "كرة قدم",
  FUTSAL: "صالات",
  HANDBALL: "كرة يد",
  BASKETBALL: "كرة سلة",
  NATIONAL: "منتخبات",
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [playerTeamId, setPlayerTeamId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: "", shortName: "", category: "FOOTBALL", logoUrl: "", primaryColor: "#1E3A8A", country: "", city: "", stadium: "", coach: "", founded: "" });
  const [playerForm, setPlayerForm] = useState({ name: "", shirtNumber: 0, position: "Forward", imageUrl: "", nationality: "" });

  const load = useCallback(async () => {
    try {
      const [tRes, cRes] = await Promise.all([teamApi.getAll({ includePlayers: "true" }), adminApi.getCompetitions()]);
      setTeams(tRes.data.data || []);
      setCompetitions(cRes.data.data || []);
    } catch { toast.error("فشل التحميل"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setLogoFile(null);
    setLogoPreview("");
    setForm({ ...form, logoUrl: "" });
  };

  const openCreate = () => {
    setEditing(null);
    setLogoFile(null);
    setLogoPreview("");
    setForm({ name: "", shortName: "", category: "FOOTBALL", logoUrl: "", primaryColor: "#1E3A8A", country: "", city: "", stadium: "", coach: "", founded: "" });
    setShowModal(true);
  };

  const openEdit = (t: any) => {
    setEditing(t);
    setLogoFile(null);
    setLogoPreview(t.logoUrl ? (t.logoUrl.startsWith("http") ? t.logoUrl : `${API_BASE}${t.logoUrl}`) : "");
    setForm({ name: t.name || "", shortName: t.shortName || "", category: t.category || "FOOTBALL", logoUrl: t.logoUrl || "", primaryColor: t.primaryColor || "#1E3A8A", country: t.country || "", city: t.city || "", stadium: t.stadium || "", coach: t.coach || "", founded: t.founded || "" });
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
      if (editing) { await teamApi.update(editing.id, payload); toast.success("تم تحديث الفريق"); }
      else { await teamApi.create(payload); toast.success("تم إنشاء الفريق"); }
      setShowModal(false); load();
    } catch (err: any) { setUploading(false); toast.error(err.response?.data?.message || "فشل"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا الفريق؟")) return;
    try { await teamApi.delete(id); toast.success("تم الحذف"); load(); }
    catch { toast.error("فشل الحذف"); }
  };

  const openAddPlayer = (teamId: string) => { setPlayerTeamId(teamId); setEditingPlayer(null); setPlayerForm({ name: "", shirtNumber: 0, position: "Forward", imageUrl: "", nationality: "" }); setShowPlayerModal(true); };
  const openEditPlayer = (teamId: string, p: any) => { setPlayerTeamId(teamId); setEditingPlayer(p); setPlayerForm({ name: p.name || "", shirtNumber: p.shirtNumber || 0, position: p.position || "Forward", imageUrl: p.imageUrl || "", nationality: p.nationality || "" }); setShowPlayerModal(true); };

  const handleSavePlayer = async () => {
    try {
      if (editingPlayer) { await teamApi.updatePlayer(playerTeamId, editingPlayer.id, playerForm); toast.success("تم تحديث اللاعب"); }
      else { await teamApi.addPlayer(playerTeamId, playerForm); toast.success("تم إضافة اللاعب"); }
      setShowPlayerModal(false); load();
    } catch (err: any) { toast.error(err.response?.data?.message || "فشل"); }
  };

  const handleDeletePlayer = async (teamId: string, playerId: string) => {
    if (!confirm("حذف اللاعب؟")) return;
    try { await teamApi.deletePlayer(teamId, playerId); toast.success("تم الحذف"); load(); }
    catch { toast.error("فشل"); }
  };

  const getLogoSrc = (t: any) => {
    if (!t.logoUrl) return "";
    return t.logoUrl.startsWith("http") ? t.logoUrl : `${API_BASE}${t.logoUrl}`;
  };

  const filtered = teams.filter((t: any) => t.name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">الفرق</h1><p className="text-sm text-gray-400">{teams.length} فريق</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> إنشاء فريق</button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2">
        <Search className="h-4 w-4 text-gray-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث عن الفرق..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-500" />
      </div>

      <div className="space-y-2">
        {filtered.map((t: any) => (
          <div key={t.id} className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                {getLogoSrc(t) ? (
                  <img src={getLogoSrc(t)} alt="" className="h-10 w-10 rounded-lg object-contain" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: t.primaryColor || "#1E3A8A" }}>
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{t.name}</p>
                    {t.primaryColor && <span className="h-3 w-3 rounded-full border border-gray-600" style={{ backgroundColor: t.primaryColor }} />}
                  </div>
                  <p className="text-xs text-gray-400">{t.shortName} · {CATEGORIES[t.category] || t.category} · {t.country || "غير محدد"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setExpandedTeam(expandedTeam === t.id ? null : t.id)} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800">
                  <Users className="h-3.5 w-3.5" /> {t.players?.length || 0} لاعب
                  {expandedTeam === t.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => openEdit(t)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(t.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-600/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            {expandedTeam === t.id && (
              <div className="border-t border-gray-800 px-4 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-400 uppercase">اللاعبون</p>
                  <button onClick={() => openAddPlayer(t.id)} className="flex items-center gap-1 rounded-lg bg-blue-600/10 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-600/20"><Plus className="h-3 w-3" /> إضافة</button>
                </div>
                <div className="space-y-1">
                  {(t.players || []).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-800/50">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-800 text-xs text-gray-400">{p.shirtNumber}</span>
                        <span className="text-sm text-white">{p.name}</span>
                        <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">{p.position}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditPlayer(t.id, p)} className="rounded p-1.5 text-gray-500 hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDeletePlayer(t.id, p.id)} className="rounded p-1.5 text-gray-500 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                  {(!t.players || t.players.length === 0) && <p className="py-4 text-center text-sm text-gray-500">لا يوجد لاعبون</p>}
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="p-8 text-center text-gray-500">لا توجد فرق</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{editing ? "تعديل الفريق" : "إنشاء فريق"}</h2><button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              {/* Logo Upload */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">شعار الفريق</label>
                <div className="flex items-center gap-4">
                  <div onClick={() => logoRef.current?.click()}
                    className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-gray-800 hover:border-blue-500 transition-colors overflow-hidden"
                  >
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
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">
                      <p>اضغط لرفع شعار الفريق</p>
                      <p>PNG, JPG, SVG</p>
                      {logoFile && <p className="mt-1 text-blue-400">{logoFile.name}</p>}
                    </div>
                    {(logoPreview || form.logoUrl) && (
                      <button type="button" onClick={removeImage} className="mt-2 rounded bg-red-600/10 px-2 py-1 text-xs text-red-400 hover:bg-red-600/20">
                        حذف الصورة
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">اسم الفريق</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">الاسم المختصر</label><input value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">اللون الرئيسي</label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_COLORS.map((c) => (
                    <button key={c.value} type="button" onClick={() => setForm({ ...form, primaryColor: c.value })}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${form.primaryColor === c.value ? "border-blue-500 bg-blue-600/10 text-blue-400" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"}`}
                    >
                      <span className="h-4 w-4 rounded-full border border-gray-600" style={{ backgroundColor: c.value }} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div><label className="mb-1 block text-xs text-gray-400">الفئة</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none">
                  {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">الدولة</label><input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">المدينة</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">الملعب</label><input value={form.stadium} onChange={(e) => setForm({ ...form, stadium: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">المدرب</label><input value={form.coach} onChange={(e) => setForm({ ...form, coach: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              </div>
              <div><label className="mb-1 block text-xs text-gray-400">سنة التأسيس</label><input value={form.founded} onChange={(e) => setForm({ ...form, founded: e.target.value })} placeholder="مثلاً 1950" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
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

      {showPlayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{editingPlayer ? "تعديل اللاعب" : "إضافة لاعب"}</h2><button onClick={() => setShowPlayerModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs text-gray-400">الاسم</label><input value={playerForm.name} onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">الرقم</label><input type="number" value={playerForm.shirtNumber} onChange={(e) => setPlayerForm({ ...playerForm, shirtNumber: Number(e.target.value) })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">المركز</label>
                  <select value={playerForm.position} onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none">
                    {[["Goalkeeper","حارس"],["Defender","مدافع"],["Midfielder","وسط"],["Forward","مهاجم"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="mb-1 block text-xs text-gray-400">الجنسية</label><input value={playerForm.nationality} onChange={(e) => setPlayerForm({ ...playerForm, nationality: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
            </div>
            <div className="mt-5 flex gap-3"><button onClick={() => setShowPlayerModal(false)} className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800">إلغاء</button><button onClick={handleSavePlayer} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">حفظ</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
