import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Order } from '../orders/order.entity';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  path: '/socket.io',
})
export class OrdersGateway implements OnGatewayConnection {
  private readonly logger = new Logger(OrdersGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.debug(`Staff socket connected: ${client.id}`);
  }

  @SubscribeMessage('join-staff')
  handleJoinStaff(@ConnectedSocket() client: Socket, @MessageBody() _body?: unknown) {
    client.join('staff');
    return { ok: true };
  }

  notifyOnlineOrder(order: Order) {
    if (!this.server || !order) return;
    this.server.to('staff').emit('online-order', {
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      customerName: order.createdBy?.name || 'Customer',
      itemCount: order.items?.length || 0,
      createdAt: order.createdAt,
    });
  }
}
