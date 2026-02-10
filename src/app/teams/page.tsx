"use client";

import { useEffect, useState, useCallback } from "react";
import { teamApi, adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Users, X, ChevronDown, ChevronUp } from "lucide-react";

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
  const [form, setForm] = useState({ name: "", shortName: "", category: "FOOTBALL", logoUrl: "", primaryColor: "", country: "", city: "", stadium: "", coach: "", founded: "" });
  const [playerForm, setPlayerForm] = useState({ name: "", shirtNumber: 0, position: "Forward", imageUrl: "", nationality: "" });

  const load = useCallback(async () => {
    try {
      const [tRes, cRes] = await Promise.all([teamApi.getAll({ includePlayers: "true" }), adminApi.getCompetitions()]);
      setTeams(tRes.data.data || []);
      setCompetitions(cRes.data.data || []);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ name: "", shortName: "", category: "FOOTBALL", logoUrl: "", primaryColor: "", country: "", city: "", stadium: "", coach: "", founded: "" }); setShowModal(true); };
  const openEdit = (t: any) => { setEditing(t); setForm({ name: t.name || "", shortName: t.shortName || "", category: t.category || "FOOTBALL", logoUrl: t.logoUrl || "", primaryColor: t.primaryColor || "", country: t.country || "", city: t.city || "", stadium: t.stadium || "", coach: t.coach || "", founded: t.founded || "" }); setShowModal(true); };

  const handleSave = async () => {
    try {
      if (editing) { await teamApi.update(editing.id, form); toast.success("Team updated"); }
      else { await teamApi.create(form); toast.success("Team created"); }
      setShowModal(false); load();
    } catch (err: any) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this team?")) return;
    try { await teamApi.delete(id); toast.success("Deleted"); load(); }
    catch { toast.error("Failed to delete"); }
  };

  const openAddPlayer = (teamId: string) => { setPlayerTeamId(teamId); setEditingPlayer(null); setPlayerForm({ name: "", shirtNumber: 0, position: "Forward", imageUrl: "", nationality: "" }); setShowPlayerModal(true); };
  const openEditPlayer = (teamId: string, p: any) => { setPlayerTeamId(teamId); setEditingPlayer(p); setPlayerForm({ name: p.name || "", shirtNumber: p.shirtNumber || 0, position: p.position || "Forward", imageUrl: p.imageUrl || "", nationality: p.nationality || "" }); setShowPlayerModal(true); };

  const handleSavePlayer = async () => {
    try {
      if (editingPlayer) { await teamApi.updatePlayer(playerTeamId, editingPlayer.id, playerForm); toast.success("Player updated"); }
      else { await teamApi.addPlayer(playerTeamId, playerForm); toast.success("Player added"); }
      setShowPlayerModal(false); load();
    } catch (err: any) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleDeletePlayer = async (teamId: string, playerId: string) => {
    if (!confirm("Delete player?")) return;
    try { await teamApi.deletePlayer(teamId, playerId); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  const filtered = teams.filter((t: any) => t.name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Teams</h1><p className="text-sm text-gray-400">{teams.length} teams</p></div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Create Team</button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2">
        <Search className="h-4 w-4 text-gray-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teams..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-500" />
      </div>

      <div className="space-y-2">
        {filtered.map((t: any) => (
          <div key={t.id} className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                {t.logoUrl && <img src={t.logoUrl} alt="" className="h-8 w-8 rounded-lg object-contain" />}
                <div>
                  <p className="font-medium text-white">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.shortName} · {t.category} · {t.country || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setExpandedTeam(expandedTeam === t.id ? null : t.id)} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800">
                  <Users className="h-3.5 w-3.5" /> {t.players?.length || 0} players
                  {expandedTeam === t.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => openEdit(t)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(t.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-600/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            {expandedTeam === t.id && (
              <div className="border-t border-gray-800 px-4 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-400 uppercase">Players</p>
                  <button onClick={() => openAddPlayer(t.id)} className="flex items-center gap-1 rounded-lg bg-blue-600/10 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-600/20"><Plus className="h-3 w-3" /> Add</button>
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
                  {(!t.players || t.players.length === 0) && <p className="py-4 text-center text-sm text-gray-500">No players</p>}
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="p-8 text-center text-gray-500">No teams found</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{editing ? "Edit Team" : "Create Team"}</h2><button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              {[["name","Team Name"],["shortName","Short Name"],["logoUrl","Logo URL"],["primaryColor","Primary Color"],["country","Country"],["city","City"],["stadium","Stadium"],["coach","Coach"],["founded","Founded"]].map(([key, label]) => (
                <div key={key}><label className="mb-1 block text-xs text-gray-400">{label}</label><input value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              ))}
              <div><label className="mb-1 block text-xs text-gray-400">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none">
                  {["FOOTBALL","FUTSAL","VOLLEYBALL","BASKETBALL","HANDBALL","TENNIS"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5 flex gap-3"><button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800">Cancel</button><button onClick={handleSave} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">Save</button></div>
          </div>
        </div>
      )}

      {showPlayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{editingPlayer ? "Edit Player" : "Add Player"}</h2><button onClick={() => setShowPlayerModal(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button></div>
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs text-gray-400">Name</label><input value={playerForm.name} onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-gray-400">Number</label><input type="number" value={playerForm.shirtNumber} onChange={(e) => setPlayerForm({ ...playerForm, shirtNumber: Number(e.target.value) })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                <div><label className="mb-1 block text-xs text-gray-400">Position</label>
                  <select value={playerForm.position} onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none">
                    {["Goalkeeper","Defender","Midfielder","Forward"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="mb-1 block text-xs text-gray-400">Nationality</label><input value={playerForm.nationality} onChange={(e) => setPlayerForm({ ...playerForm, nationality: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
            </div>
            <div className="mt-5 flex gap-3"><button onClick={() => setShowPlayerModal(false)} className="flex-1 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800">Cancel</button><button onClick={handleSavePlayer} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
