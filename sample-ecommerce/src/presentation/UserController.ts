import { OrderApplicationService } from '../application/OrderApplicationService';
// INTENTIONAL DRIFT VIOLATION DRIFT-001: Presentation layer importing Infrastructure Database directly!
import { DatabaseRepository } from '../infrastructure/DatabaseRepository';

export class UserController {
  private orderService: OrderApplicationService;
  private dbRepo: DatabaseRepository;

  constructor() {
    this.orderService = new OrderApplicationService();
    this.dbRepo = new DatabaseRepository();
  }

  public async getUserProfile(userId: string) {
    // VIOLATION EVIDENCE: Direct database query in Presentation Layer
    const rawUserData = await this.dbRepo.executeQuery(`SELECT * FROM users WHERE id = '${userId}'`);
    return { status: 200, data: rawUserData };
  }
}
