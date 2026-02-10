"use client";

import { useEffect, useState } from "react";
import { adminApi, orderApi } from "@/lib/api";
import { toast } from "sonner";
import {
  Users, UserCog, Swords, Radio, Shield, UserCheck,
  Package, ClipboardList, TrendingUp, ShoppingBag,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalOperators: number;
  totalMatches: number;
  liveMatches: number;
  totalTeams: number;
  totalPlayers: number;
}

interface OrderCounts {
  pending: number;
  approved: number;
  rejected: number;
  delivered: number;
  total: number;
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value.toLocaleString()}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orderCounts, setOrderCounts] = useState<OrderCounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        adminApi.getStats(),
        orderApi.getCounts(),
      ]);
      setStats(statsRes.data.data);
      setOrderCounts(ordersRes.data.data);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">Overview of your application</p>
      </div>

      <div className="mb-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">App Statistics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Users" value={stats?.totalUsers || 0} icon={Users} color="bg-blue-600" />
          <StatCard label="Operators" value={stats?.totalOperators || 0} icon={UserCog} color="bg-purple-600" />
          <StatCard label="Matches" value={stats?.totalMatches || 0} icon={Swords} color="bg-green-600" />
          <StatCard label="Live Now" value={stats?.liveMatches || 0} icon={Radio} color="bg-red-600" />
          <StatCard label="Teams" value={stats?.totalTeams || 0} icon={Shield} color="bg-orange-600" />
          <StatCard label="Players" value={stats?.totalPlayers || 0} icon={UserCheck} color="bg-cyan-600" />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Orders</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Orders" value={orderCounts?.total || 0} icon={ShoppingBag} color="bg-blue-600" />
          <StatCard label="Pending" value={orderCounts?.pending || 0} icon={ClipboardList} color="bg-yellow-600" />
          <StatCard label="Approved" value={orderCounts?.approved || 0} icon={TrendingUp} color="bg-green-600" />
          <StatCard label="Rejected" value={orderCounts?.rejected || 0} icon={Package} color="bg-red-600" />
          <StatCard label="Delivered" value={orderCounts?.delivered || 0} icon={Package} color="bg-emerald-600" />
        </div>
      </div>
    </div>
  );
}
