"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";
import { Activity } from "lucide-react";

const eventTypeColor: Record<string, string> = {
  goal: "bg-green-600/20 text-green-400",
  yellow_card: "bg-yellow-600/20 text-yellow-400",
  red_card: "bg-red-600/20 text-red-400",
  substitution: "bg-blue-600/20 text-blue-400",
  assist: "bg-purple-600/20 text-purple-400",
  penalty: "bg-orange-600/20 text-orange-400",
};

export default function EventLogsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const res = await adminApi.getEventLogs({ limit: 100 }); setEvents(res.data.data || []); }
    catch { toast.error("فشل تحميل سجل الأحداث"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">سجل الأحداث</h1>
        <p className="text-sm text-gray-400">{events.length} حدث</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="px-4 py-3 text-right font-medium">النوع</th>
              <th className="px-4 py-3 text-right font-medium">المباراة</th>
              <th className="px-4 py-3 text-right font-medium">اللاعب</th>
              <th className="px-4 py-3 text-right font-medium">الدقيقة</th>
              <th className="px-4 py-3 text-right font-medium">بواسطة</th>
              <th className="px-4 py-3 text-right font-medium">الوقت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {events.map((e: any) => (
              <tr key={e.id} className="hover:bg-gray-900/50">
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${eventTypeColor[e.type] || "bg-gray-700 text-gray-300"}`}>
                    {e.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-white">
                  {e.match ? `${e.match.homeTeam?.name || "?"} vs ${e.match.awayTeam?.name || "?"}` : "-"}
                </td>
                <td className="px-4 py-3 text-gray-400">{e.player?.name || "-"}</td>
                <td className="px-4 py-3 text-gray-400">{e.minute ? `${e.minute}'` : "-"}</td>
                <td className="px-4 py-3 text-gray-400">{e.createdBy?.name || "-"}</td>
                <td className="px-4 py-3 text-gray-500">{formatDateTime(e.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && (
          <div className="flex flex-col items-center py-12">
            <Activity className="mb-3 h-8 w-8 text-gray-600" />
            <p className="text-gray-500">لا توجد أحداث</p>
          </div>
        )}
      </div>
    </div>
  );
}
