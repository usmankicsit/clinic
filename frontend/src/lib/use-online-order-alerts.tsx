'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { money } from '@/lib/format';

export type OnlineOrderAlert = {
  id: string;
  orderNumber: string;
  total: number | string;
  customerName: string;
  itemCount: number;
  createdAt?: string;
};

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
).replace(/\/$/, '');

export function useOnlineOrderAlerts(enabled: boolean) {
  const router = useRouter();
  const [alert, setAlert] = useState<OnlineOrderAlert | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const socket: Socket = io(API_ORIGIN, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      socket.emit('join-staff');
    });

    socket.on('online-order', (data: OnlineOrderAlert) => {
      setAlert(data);
      try {
        if (typeof Notification !== 'undefined') {
          if (Notification.permission === 'granted') {
            const n = new Notification(`New online order ${data.orderNumber}`, {
              body: `${data.customerName} · ${data.itemCount} item(s)`,
            });
            n.onclick = () => {
              window.focus();
              router.push(`/online-orders#order-${data.id}`);
            };
          } else if (Notification.permission === 'default') {
            Notification.requestPermission();
          }
        }
      } catch {
        /* ignore */
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [enabled, router]);

  function dismiss() {
    setAlert(null);
  }

  function openOrder() {
    if (!alert) return;
    const id = alert.id;
    setAlert(null);
    router.push(`/online-orders#order-${id}`);
  }

  return { alert, dismiss, openOrder, money };
}

export function OnlineOrderToast({ enabled }: { enabled: boolean }) {
  const { alert, dismiss, openOrder } = useOnlineOrderAlerts(enabled);
  if (!alert) return null;

  return (
    <div className="order-toast" role="alert">
      <div>
        <strong>New online order</strong>
        <p>
          {alert.orderNumber} · {alert.customerName} · {money(alert.total)}
        </p>
      </div>
      <div className="inline-actions">
        <button type="button" className="btn btn-primary" onClick={openOrder}>
          Open order
        </button>
        <button type="button" className="btn" onClick={dismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
