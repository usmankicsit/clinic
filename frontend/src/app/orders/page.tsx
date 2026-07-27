'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { InvoiceActions } from '@/components/InvoiceActions';
import { AppShell } from '@/components/AppShell';
import { CustomSelect } from '@/components/CustomSelect';
import { IconButton } from '@/components/IconButton';
import { ListToolbar, PaginationBar } from '@/components/ListControls';
import { api, ApiError } from '@/lib/api';
import { money } from '@/lib/format';
import { usePagedList } from '@/lib/use-paged-list';
import type { Order, OrderSource, OrderStatus, ShopSettings } from '@/lib/types';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState({ orderCount: 0, revenue: 0 });
  const [shop, setShop] = useState<ShopSettings | null>(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState(todayIso);
  const [toDate, setToDate] = useState(todayIso);

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ from: fromDate, to: toDate });
      const [data, s] = await Promise.all([
        api<{
          orderCount: number;
          revenue: number;
          orders: Order[];
        }>(`/orders/range/summary?${qs.toString()}`),
        api<ShopSettings>('/shop'),
      ]);
      setOrders(data.orders);
      setSummary({ orderCount: data.orderCount, revenue: data.revenue });
      setShop(s);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load orders');
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const filteredBySelects = useMemo(
    () =>
      orders.filter((order) => {
        if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
        if (sourceFilter !== 'ALL' && (order.source || 'POS') !== sourceFilter) {
          return false;
        }
        return true;
      }),
    [orders, statusFilter, sourceFilter],
  );

  const filterFn = useCallback((order: Order, q: string) => {
    if (!q) return true;
    const items = (order.items || [])
      .map((i) => i.productName)
      .join(' ')
      .toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(q) ||
      (order.createdBy?.name || '').toLowerCase().includes(q) ||
      (order.createdBy?.email || '').toLowerCase().includes(q) ||
      items.includes(q) ||
      order.paymentMethod.toLowerCase().includes(q)
    );
  }, []);

  const list = usePagedList(filteredBySelects, filterFn);

  async function updateStatus(id: string, status: OrderStatus) {
    setError('');
    try {
      await api(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    }
  }

  const isToday =
    fromDate === todayIso() && toDate === todayIso();

  return (
    <AppShell>
      <div className="page-stack">
        <div className="page-header">
          <div>
            <h1>{isToday ? "Today's Orders" : 'Orders'}</h1>
            <p>
              {isToday
                ? 'All counter and online orders for today'
                : `Orders from ${fromDate} to ${toDate}`}
            </p>
          </div>
          <button className="btn" onClick={load}>
            Refresh
          </button>
        </div>
        {error && <div className="error">{error}</div>}
        <div className="card-panel" style={{ marginBottom: 16 }}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr auto auto' }}>
            <div className="form-row">
              <label>From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>To</label>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <button
              className="btn"
              type="button"
              style={{ alignSelf: 'end' }}
              onClick={() => {
                const t = todayIso();
                setFromDate(t);
                setToDate(t);
              }}
            >
              Today
            </button>
            <button
              className="btn btn-primary"
              type="button"
              style={{ alignSelf: 'end' }}
              onClick={load}
            >
              Apply
            </button>
          </div>
        </div>
        <div className="grid-stats">
          <div className="stat">
            <label>Orders</label>
            <strong>{summary.orderCount}</strong>
          </div>
          <div className="stat">
            <label>Revenue</label>
            <strong>{money(summary.revenue, shop?.currency)}</strong>
          </div>
        </div>
        <div className="list-panel">
          <ListToolbar
            search={list.search}
            onSearchChange={(v) => {
              list.setSearch(v);
            }}
            searchPlaceholder="Search order #, customer, item…"
          >
            <CustomSelect
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                list.setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'DONE', label: 'Done' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
            <CustomSelect
              aria-label="Filter by source"
              value={sourceFilter}
              onChange={(v) => {
                setSourceFilter(v as OrderSource | 'ALL');
                list.setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All sources' },
                { value: 'POS', label: 'POS' },
                { value: 'ONLINE', label: 'Online' },
              ]}
            />
          </ListToolbar>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Source</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.pageItems.map((order) => (
                  <tr key={order.id} id={`order-${order.id}`}>
                    <td>
                      <strong>{order.orderNumber}</strong>
                      <div className="muted">
                        {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td>{order.source || 'POS'}</td>
                    <td>{order.createdBy?.name || '—'}</td>
                    <td>
                      {(order.items || [])
                        .map((i) => `${i.productName} ×${i.quantity}`)
                        .join(', ')}
                    </td>
                    <td>{order.paymentMethod}</td>
                    <td>{money(order.total, shop?.currency)}</td>
                    <td>
                      <span className={`badge status-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div className="inline-actions">
                        {order.status === 'PENDING' && (
                          <IconButton
                            label="Mark done"
                            icon="check"
                            variant="success"
                            onClick={() => updateStatus(order.id, 'DONE')}
                          />
                        )}
                        {order.status === 'PENDING' && (
                          <IconButton
                            label="Cancel order"
                            icon="x"
                            variant="danger"
                            onClick={() => updateStatus(order.id, 'CANCELLED')}
                          />
                        )}
                        <InvoiceActions order={order} shop={shop} />
                      </div>
                    </td>
                  </tr>
                ))}
                {!list.pageItems.length && (
                  <tr>
                    <td colSpan={8} className="empty">
                      No orders in this date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={list.page}
            totalPages={list.totalPages}
            totalFiltered={list.totalFiltered}
            pageSize={list.pageSize}
            onPageChange={list.setPage}
          />
        </div>
      </div>
    </AppShell>
  );
}
