export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CASHIER = 'CASHIER',
  CUSTOMER = 'CUSTOMER',
}

/** Staff workflow: Pending → Done (Cancelled optional). */
export enum OrderStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
}

export enum OrderSource {
  POS = 'POS',
  ONLINE = 'ONLINE',
}
