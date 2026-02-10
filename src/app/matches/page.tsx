"use client";

import { useEffect, useState, useCallback } from "react";
import { matchApi, teamApi, adminApi } from "@/lib/api";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";
import { Plus, Pencil, Trash2, Search, Radio, X } from "lucide-react";

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    competitionId: "", homeTeamId: "", awayTeamId: "",
    date: "", hour: "06", minute: "00", ampm: "م",
    venue: "", isFeatured: false, referee: "", matchday: "", season: "", operatorId: "",
  });

  const load = useCallback(async () => {
    try {
      const [mRes, tRes, cRes, oRes] = await Promise.all([
        matchApi.getAll(), teamApi.getAll(), adminApi.getCompetitions(), adminApi.getOperators(),
      ]);
      setMatches(mRes.data.data || []);
      setTeams(tRes.data.data || []);
      setCompetitions(cRes.data.data || []);
      setOperators(oRes.data.data || []);
    } catch { toast.error("فشل تحميل البيانات"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const buildISO = () => {
    if (!form.date) return "";
    let h = parseInt(form.hour);
    if (form.ampm === "م" && h < 12) h += 12;
    if (form.ampm === "ص" && h === 12) h = 0;
    return `${form.date}T${String(h).padStart(2, "0")}:${form.minute}:00`;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ competitionId: "", homeTeamId: "", awayTeamId: "", date: "", hour: "06", minute: "00", ampm: "م", venue: "", isFeatured: false, referee: "", matchday: "", season: "", operatorId: "" });
    setShowModal(true);
  };

  const openEdit = (m: any) => {
    setEditing(m);
    let date = "", hour = "06", minute = "00", ampm = "م";
    if (m.startTime) {
      const d = new Date(m.startTime);
      date = d.toISOString().slice(0, 10);
      let h = d.getHours();
      ampm = h >= 12 ? "م" : "ص";
      h = h % 12 || 12;
      hour = String(h).padStart(2, "0");
      minute = String(d.getMinutes()).padStart(2, "0");
    }
    setForm({
      competitionId: m.competitionId || "", homeTeamId: m.homeTeamId || "", awayTeamId: m.awayTeamId || "",
      date, hour, minute, ampm,
      venue: m.venue || "", isFeatured: m.isFeatured || false, referee: m.referee || "", matchday: m.matchday || "", season: m.season || "", operatorId: "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.competitionId || !form.homeTeamId || !form.awayTeamId || !form.date) {
      toast.error("يرجى ملء الحقول المطلوبة (المسابقة، الفريقين، التاريخ)");
      return;
    }
    const iso = buildISO();
    if (!iso) { toast.error("يرجى تحديد التاريخ"); return; }
    try {
      const payload: any = {
        competitionId: form.competitionId,
        homeTeamId: form.homeTeamId,
        awayTeamId: form.awayTeamId,
        startTime: new Date(iso).toISOString(),
        venue: form.venue || undefined,
        isFeatured: form.isFeatured,
        referee: form.referee || undefined,
        matchday: form.matchday || undefined,
        season: form.season || undefined,
      };
      if (!editing && form.operatorId) payload.operatorId = form.operatorId;

      if (editing) {
        await matchApi.update(editing.id, payload);
        toast.success("تم تحديث المباراة");
      } else {
        await matchApi.create(payload);
        toast.success("تم إنشاء المباراة");
      }
      setShowModal(false);
      load();
    } catch (err: any) { toast.error(err.response?.data?.message || "فشل الحفظ"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذه المباراة؟")) return;
    try { await matchApi.delete(id); toast.success("تم الحذف"); load(); }
    catch { toast.error("فشل الحذف"); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try { await matchApi.updateStatus(id, { status }); toast.success("تم تحديث الحالة"); load(); }
    catch { toast.error("فشل تحديث الحالة"); }
  };

  const filtered = matches.filter((m: any) =>
    (m.homeTeam?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.awayTeam?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    scheduled: "bg-gray-700 text-gray-300",
    live: "bg-red-600/20 text-red-400",
    halftime: "bg-yellow-600/20 text-yellow-400",
    finished: "bg-green-600/20 text-green-400",
  };

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">المباريات</h1>
          <p className="text-sm text-gray-400">{matches.length} مباراة</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> إنشاء مباراة
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2">
        <Search className="h-4 w-4 text-gray-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث عن الفرق..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-500" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="px-4 py-3 text-right font-medium">المباراة</th>
              <th className="px-4 py-3 text-right font-medium">المسابقة</th>
              <th className="px-4 py-3 text-right font-medium">التاريخ</th>
              <th className="px-4 py-3 text-right font-medium">النتيجة</th>
              <th className="px-4 py-3 text-right font-medium">الحالة</th>
              <th className="px-4 py-3 text-left font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map((m: any) => (
              <tr key={m.id} className="hover:bg-gray-900/50">
                <td className="px-4 py-3 text-white font-medium">{m.homeTeam?.name || "?"} vs {m.awayTeam?.name || "?"}</td>
                <td className="px-4 py-3 text-gray-400">{m.competition?.name || "-"}</td>
                <td className="px-4 py-3 text-gray-400">{formatDateTime(m.startTime)}</td>
                <td className="px-4 py-3 text-white font-bold">{m.homeScore} - {m.awayScore}</td>
                <td className="px-4 py-3">
                  <select
                    value={m.status}
                    onChange={(e) => handleStatusChange(m.id, e.target.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[m.status] || "bg-gray-700 text-gray-300"} border-0 outline-none cursor-pointer`}
                  >
                    <option value="scheduled">مجدولة</option>
                    <option value="live">مباشر</option>
                    <option value="halftime">استراحة</option>
                    <option value="finished">انتهت</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(m)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(m.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-600/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-8 text-center text-gray-500">لا توجد مباريات</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{editing ? "تعديل المباراة" : "إنشاء مباراة"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">المسابقة *</label>
                <select value={form.competitionId} onChange={(e) => setForm({ ...form, competitionId: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none">
                  <option value="">اختر المسابقة...</option>
                  {competitions.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">فريق المضيف *</label>
                  <select value={form.homeTeamId} onChange={(e) => setForm({ ...form, homeTeamId: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none">
                    <option value="">اختر...</option>
                    {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">فريق الضيف *</label>
                  <select value={form.awayTeamId} onChange={(e) => setForm({ ...form, awayTeamId: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none">
                    <option value="">اختر...</option>
                    {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              {/* Date & Time with AM/PM */}
              <div>
                <label className="mb-1 block text-xs text-gray-400">التاريخ والوقت *</label>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-2">
                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" />
                  </div>
                  <div className="flex gap-1">
                    <select value={form.hour} onChange={(e) => setForm({ ...form, hour: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-1 py-2 text-sm text-white outline-none text-center">
                      {hours.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="flex items-center text-gray-500">:</span>
                    <select value={form.minute} onChange={(e) => setForm({ ...form, minute: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-1 py-2 text-sm text-white outline-none text-center">
                      {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="flex h-full rounded-lg border border-gray-700 overflow-hidden">
                      <button type="button" onClick={() => setForm({ ...form, ampm: "ص" })}
                        className={`flex-1 py-2 text-xs font-medium transition-colors ${form.ampm === "ص" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                        ص
                      </button>
                      <button type="button" onClick={() => setForm({ ...form, ampm: "م" })}
                        className={`flex-1 py-2 text-xs font-medium transition-colors ${form.ampm === "م" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                        م
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">الملعب</label>
                  <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="اسم الملعب" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">الحكم</label>
                  <input value={form.referee} onChange={(e) => setForm({ ...form, referee: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">يوم المباراة</label>
                  <input value={form.matchday} onChange={(e) => setForm({ ...form, matchday: e.target.value })} placeholder="مثلاً الجولة 5" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">الموسم</label>
                  <input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} placeholder="مثلاً 2024-2025" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" />
                </div>
              </div>
              {!editing && (
                <div>
                  <label className="mb-1 block text-xs text-gray-400">تعيين مشغل (اختياري)</label>
                  <select value={form.operatorId} onChange={(e) => setForm({ ...form, operatorId: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none">
                    <option value="">بدون مشغل</option>
                    {operators.map((op: any) => <option key={op.id} value={op.id}>{op.name} ({op.email})</option>)}
                  </select>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="rounded" /> مباراة مميزة
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800">إلغاء</button>
              <button onClick={handleSave} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
