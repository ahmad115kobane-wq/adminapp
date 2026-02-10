"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { Search, Ban, Shield, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({ search: search || undefined, role: roleFilter, page, limit: 15 });
      setUsers(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  }, [search, roleFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const handleToggleBan = async (id: string) => {
    try { const res = await adminApi.toggleBan(id); toast.success(res.data.message); load(); }
    catch { toast.error("Failed"); }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try { await adminApi.updateRole(id, role); toast.success("Role updated"); load(); }
    catch (err: any) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user permanently?")) return;
    try { await adminApi.deleteUser(id); toast.success("User deleted"); load(); }
    catch (err: any) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const roleColor: Record<string, string> = {
    admin: "bg-red-600/20 text-red-400",
    operator: "bg-purple-600/20 text-purple-400",
    publisher: "bg-blue-600/20 text-blue-400",
    user: "bg-gray-700 text-gray-300",
    guest: "bg-gray-800 text-gray-500",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-sm text-gray-400">{total} total users</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2">
          <Search className="h-4 w-4 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-500" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2.5 text-sm text-white outline-none">
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="operator">Operator</option>
          <option value="publisher">Publisher</option>
          <option value="user">User</option>
          <option value="guest">Guest</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center"><div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></td></tr>
            ) : users.map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-900/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-xs font-medium text-white">{u.name?.charAt(0) || "?"}</div>
                    <div><p className="font-medium text-white">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} className={`rounded-full px-3 py-1 text-xs font-medium border-0 outline-none cursor-pointer ${roleColor[u.role] || "bg-gray-700 text-gray-300"}`}>
                    {["user", "operator", "publisher", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {u.isBanned ? <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-medium text-red-400">Banned</span> : <span className="rounded-full bg-green-600/20 px-3 py-1 text-xs font-medium text-green-400">Active</span>}
                </td>
                <td className="px-4 py-3 text-gray-400">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleToggleBan(u.id)} title={u.isBanned ? "Unban" : "Ban"} className="rounded-lg p-2 text-gray-400 hover:bg-yellow-600/10 hover:text-yellow-400"><Ban className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(u.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-600/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && users.length === 0 && <p className="p-8 text-center text-gray-500">No users found</p>}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-gray-800 px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-gray-800 px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
