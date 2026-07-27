import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { OrdersGateway } from './orders.gateway';

@Global()
@Module({
  providers: [NotificationsService, OrdersGateway],
  exports: [NotificationsService, OrdersGateway],
})
export class NotificationsModule {}
