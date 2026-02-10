"use client";

import { useEffect, useState, useCallback } from "react";
import { orderApi } from "@/lib/api";
import { toast } from "sonner";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { Check, X as XIcon, Truck, Clock, Filter } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderApi.getAll({ status: statusFilter === "all" ? undefined : statusFilter });
      setOrders(res.data.data || []);
    } catch { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id: string, status: string) => {
    try {
      await orderApi.updateStatus(id, { status, adminNote: adminNote || undefined, estimatedDelivery: estimatedDelivery || undefined });
      toast.success(`Order ${status}`);
      setShowDetailModal(false);
      setAdminNote("");
      setEstimatedDelivery("");
      load();
    } catch (err: any) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const openDetail = (order: any) => { setSelectedOrder(order); setAdminNote(""); setEstimatedDelivery(""); setShowDetailModal(true); };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-600/20 text-yellow-400",
    approved: "bg-blue-600/20 text-blue-400",
    rejected: "bg-red-600/20 text-red-400",
    delivered: "bg-green-600/20 text-green-400",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Orders</h1><p className="text-sm text-gray-400">{orders.length} orders</p></div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        {["all", "pending", "approved", "rejected", "delivered"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Items</th>
                <th className="px-4 py-3 text-left font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {orders.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-900/50 cursor-pointer" onClick={() => openDetail(o)}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{o.customerName}</p>
                    <p className="text-xs text-gray-400">{o.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{o.items?.length || 0} items</td>
                  <td className="px-4 py-3 font-medium text-white">{formatPrice(o.totalAmount)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[o.status] || "bg-gray-700 text-gray-300"}`}>{o.status}</span></td>
                  <td className="px-4 py-3 text-gray-400">{formatDateTime(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {o.status === "pending" && (
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleStatus(o.id, "approved")} className="rounded-lg p-2 text-green-400 hover:bg-green-600/10" title="Approve"><Check className="h-4 w-4" /></button>
                        <button onClick={() => handleStatus(o.id, "rejected")} className="rounded-lg p-2 text-red-400 hover:bg-red-600/10" title="Reject"><XIcon className="h-4 w-4" /></button>
                      </div>
                    )}
                    {o.status === "approved" && (
                      <button onClick={(e) => { e.stopPropagation(); handleStatus(o.id, "delivered"); }} className="rounded-lg p-2 text-blue-400 hover:bg-blue-600/10" title="Mark Delivered"><Truck className="h-4 w-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <p className="p-8 text-center text-gray-500">No orders found</p>}
        </div>
      )}

      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Order Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-white"><XIcon className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-800/50 p-3">
                <p className="text-sm text-gray-400">Customer</p>
                <p className="font-medium text-white">{selectedOrder.customerName}</p>
                <p className="text-sm text-gray-400">{selectedOrder.customerPhone}</p>
                <p className="text-sm text-gray-400">{selectedOrder.customerAddress}</p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-400">Items</p>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2">
                      <div>
                        <p className="text-sm text-white">{item.productName}</p>
                        <p className="text-xs text-gray-400">
                          {item.selectedSize && `Size: ${item.selectedSize}`}
                          {item.selectedColor && ` · Color: ${item.selectedColor}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white">{formatPrice(item.price)} x {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between rounded-lg bg-gray-800/50 px-3 py-2">
                <span className="text-sm text-gray-400">Delivery Fee</span>
                <span className="text-sm text-white">{formatPrice(selectedOrder.deliveryFee || 0)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-blue-600/10 px-3 py-2">
                <span className="font-medium text-blue-400">Total</span>
                <span className="font-bold text-blue-400">{formatPrice(selectedOrder.totalAmount)}</span>
              </div>

              {selectedOrder.status === "pending" && (
                <div className="space-y-3 border-t border-gray-800 pt-4">
                  <div><label className="mb-1 block text-xs text-gray-400">Admin Note</label><input value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                  <div><label className="mb-1 block text-xs text-gray-400">Estimated Delivery</label><input value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} placeholder="e.g. 2-3 days" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none" /></div>
                  <div className="flex gap-3">
                    <button onClick={() => handleStatus(selectedOrder.id, "approved")} className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">Approve</button>
                    <button onClick={() => handleStatus(selectedOrder.id, "rejected")} className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700">Reject</button>
                  </div>
                </div>
              )}
              {selectedOrder.status === "approved" && (
                <button onClick={() => handleStatus(selectedOrder.id, "delivered")} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">Mark as Delivered</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
