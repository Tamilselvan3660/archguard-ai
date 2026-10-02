// INTENTIONAL CIRCULAR DEPENDENCY DRIFT-002: PaymentService imports OrderService!
import { OrderService } from './OrderService';

export class PaymentService {
  private orderService?: OrderService;

  public async processPayment(userId: string, amount: number) {
    // VIOLATION EVIDENCE: Calling back into OrderService creates a tight cycle
    if (!this.orderService) {
      this.orderService = new OrderService();
    }
    const summary = this.orderService.getOrderSummary('TEMP-01');
    return { status: 'PAID', amount, reference: summary.orderId };
  }
}
