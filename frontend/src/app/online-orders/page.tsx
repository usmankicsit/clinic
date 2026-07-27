'use client';

import { useCallback, useEffect, useState } from 'react';
import { InvoiceActions } from '@/components/InvoiceActions';
import { AppShell } from '@/components/AppShell';
import { CustomSelect } from '@/components/CustomSelect';
import { IconButton } from '@/components/IconButton';
import { ListToolbar, PaginationBar } from '@/components/ListControls';
import { api, ApiError } from '@/lib/api';
import { money } from '@/lib/format';
import { usePagedList } from '@/lib/use-paged-list';
import type { Order, OrderStatus, ShopSettings } from '@/lib/types';

export default function OnlineOrdersPage() {
  const [active, setActive] = useState<Order[]>([]);
  const [today, setToday] = useState<Order[]>([]);
  const [shop, setShop] = useState<ShopSettings | null>(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  const load = useCallback(async () => {
    try {
      const [activeOrders, allToday, s] = await Promise.all([
        api<Order[]>('/orders/online'),
        api<Order[]>('/orders/online/today'),
        api<ShopSettings>('/shop'),
      ]);
      setActive(activeOrders);
      setToday(allToday);
      setShop(s);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load online orders',
      );
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('order-')) {
      const el = document.getElementById(hash);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [today]);

  const baseList =
    statusFilter === 'ACTIVE'
      ? today.filter((o) => o.status === 'PENDING')
      : statusFilter === 'ALL'
        ? today
        : today.filter((o) => o.status === statusFilter);

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
      (order.createdBy?.phone || '').toLowerCase().includes(q) ||
      (order.createdBy?.address || '').toLowerCase().includes(q) ||
      (order.note || '').toLowerCase().includes(q) ||
      items.includes(q)
    );
  }, []);

  const list = usePagedList(baseList, filterFn);

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

  return (
    <AppShell>
      <div className="page-stack">
        <div className="page-header">
          <div>
            <h1>Online Orders</h1>
            <p>Customer website orders — mark pending as done here</p>
          </div>
          <button className="btn" onClick={load}>
            Refresh
          </button>
        </div>
        {error && <div className="error">{error}</div>}
        <div className="grid-stats">
          <div className="stat">
            <label>Pending online</label>
            <strong>{active.length}</strong>
          </div>
          <div className="stat">
            <label>Online today</label>
            <strong>{today.length}</strong>
          </div>
        </div>
        <div className="list-panel">
          <ListToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            searchPlaceholder="Search order #, customer, note…"
          >
            <CustomSelect
              aria-label="Filter online orders"
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                list.setPage(1);
              }}
              options={[
                { value: 'ACTIVE', label: 'Pending queue' },
                { value: 'ALL', label: 'All today' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'DONE', label: 'Done' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
          </ListToolbar>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
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
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                      {order.note && (
                        <div style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>
                          Note: {order.note}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{order.createdBy?.name}</strong>
                      <div className="customer-contact">
                        {order.createdBy?.phone && (
                          <a href={`tel:${order.createdBy.phone}`}>
                            {order.createdBy.phone}
                          </a>
                        )}
                        {order.createdBy?.email && (
                          <span>{order.createdBy.email}</span>
                        )}
                        {(order.createdBy?.address || order.createdBy?.city) && (
                          <span>
                            {[order.createdBy.address, order.createdBy.city]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {(order.items || [])
                        .map((i) => `${i.quantity}× ${i.productName}`)
                        .join(', ')}
                    </td>
                    <td>{money(order.total, shop?.currency)}</td>
                    <td>
                      <span className={`badge badge-${order.status}`}>
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
                        <InvoiceActions order={order} shop={shop} />
                        {order.status === 'PENDING' && (
                          <IconButton
                            label="Cancel order"
                            icon="x"
                            variant="danger"
                            onClick={() => updateStatus(order.id, 'CANCELLED')}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!list.pageItems.length && (
                  <tr>
                    <td colSpan={6} className="empty">
                      No online orders match your filters.
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
