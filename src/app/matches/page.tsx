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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    competitionId: "", homeTeamId: "", awayTeamId: "", startTime: "", venue: "", isFeatured: false, referee: "", matchday: "", season: "",
  });

  const load = useCallback(async () => {
    try {
      const [mRes, tRes, cRes] = await Promise.all([
        matchApi.getAll(), teamApi.getAll(), adminApi.getCompetitions(),
      ]);
      setMatches(mRes.data.data || []);
      setTeams(tRes.data.data || []);
      setCompetitions(cRes.data.data || []);
    } catch { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ competitionId: "", homeTeamId: "", awayTeamId: "", startTime: "", venue: "", isFeatured: false, referee: "", matchday: "", season: "" });
    setShowModal(true);
  };

  const openEdit = (m: any) => {
    setEditing(m);
    setForm({
      competitionId: m.competitionId || "", homeTeamId: m.homeTeamId || "", awayTeamId: m.awayTeamId || "",
      startTime: m.startTime ? new Date(m.startTime).toISOString().slice(0, 16) : "",
      venue: m.venue || "", isFeatured: m.isFeatured || false, referee: m.referee || "", matchday: m.matchday || "", season: m.season || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await matchApi.update(editing.id, { ...form, startTime: new Date(form.startTime).toISOString() });
        toast.success("Match updated");
      } else {
        await matchApi.create({ ...form, startTime: new Date(form.startTime).toISOString() });
        toast.success("Match created");
      }
      setShowModal(false);
      load();
    } catch (err: any) { toast.error(err.response?.data?.message || "Failed to save"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this match?")) return;
    try { await matchApi.delete(id); toast.success("Deleted"); load(); }
    catch { toast.error("Failed to delete"); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try { await matchApi.updateStatus(id, { status }); toast.success("Status updated"); load(); }
    catch { toast.error("Failed to update status"); }
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

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Matches</h1>
          <p className="text-sm text-gray-400">{matches.length} total matches</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Create Match
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2">
        <Search className="h-4 w-4 text-gray-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teams..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-500" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Match</th>
              <th className="px-4 py-3 text-left font-medium">Competition</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Score</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
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
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="halftime">Halftime</option>
                    <option value="finished">Finished</option>
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
        {filtered.length === 0 && <p className="p-8 text-center text-gray-500">No matches found</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{editing ? "Edit Match" : "Create Match"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Competition</label>
                <select value={form.competitionId} onChange={(e) => setForm({ ...form, competitionId: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none">
                  <option value="">Select...</option>
                  {competitions.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Home Team</label>
                  <select value={form.homeTeamId} onChange={(e) => setForm({ ...form, homeTeamId: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none">
                    <option value="">Select...</option>
                    {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Away Team</label>
                  <select value={form.awayTeamId} onChange={(e) => setForm({ ...form, awayTeamId: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none">
                    <option value="">Select...</option>
                    {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Start Time</label>
                <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Venue</label>
                  <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Referee</label>
                  <input value={form.referee} onChange={(e) => setForm({ ...form, referee: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="rounded" /> Featured Match
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
              <button onClick={handleSave} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
