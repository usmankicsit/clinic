import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Pusher from 'pusher';
import { Order } from '../orders/order.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private pusher: Pusher | null = null;

  constructor(private readonly config: ConfigService) {
    const appId = this.config.get<string>('PUSHER_APP_ID');
    const key = this.config.get<string>('PUSHER_KEY');
    const secret = this.config.get<string>('PUSHER_SECRET');
    const cluster = this.config.get<string>('PUSHER_CLUSTER') || 'mt1';

    if (appId && key && secret) {
      this.pusher = new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      });
      this.logger.log('Pusher notifications enabled');
    } else {
      this.logger.warn(
        'Pusher not configured (set PUSHER_APP_ID/KEY/SECRET) — realtime alerts disabled',
      );
    }
  }

  async notifyOnlineOrder(order: Order) {
    if (!this.pusher || !order) return;
    try {
      await this.pusher.trigger('staff-orders', 'online-order', {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        customerName: order.createdBy?.name || 'Customer',
        itemCount: order.items?.length || 0,
        createdAt: order.createdAt,
      });
    } catch (err) {
      this.logger.error(
        `Pusher notify failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
