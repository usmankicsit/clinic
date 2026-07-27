import { Injectable } from '@nestjs/common';
import { Order } from '../orders/order.entity';
import { OrdersGateway } from './orders.gateway';

@Injectable()
export class NotificationsService {
  constructor(private readonly ordersGateway: OrdersGateway) {}

  async notifyOnlineOrder(order: Order) {
    this.ordersGateway.notifyOnlineOrder(order);
  }
}
