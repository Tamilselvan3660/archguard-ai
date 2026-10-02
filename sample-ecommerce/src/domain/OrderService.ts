// INTENTIONAL CIRCULAR DEPENDENCY DRIFT-002: OrderService imports PaymentService
import { PaymentService } from './PaymentService';

export class OrderService {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  public async placeOrder(user: any, items: any[]) {
    const total = items.reduce((acc, i) => acc + i.price, 0);
    const paymentResult = await this.paymentService.processPayment(user.id, total);
    return { orderId: 'ORD-9021', status: paymentResult.status };
  }

  public getOrderSummary(orderId: string) {
    return { orderId, total: 199.99 };
  }
}
