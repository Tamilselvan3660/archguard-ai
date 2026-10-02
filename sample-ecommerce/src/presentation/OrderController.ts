import { OrderApplicationService } from '../application/OrderApplicationService';

export class OrderController {
  private appService: OrderApplicationService;

  constructor() {
    this.appService = new OrderApplicationService();
  }

  public async createOrder(req: any, res: any) {
    const result = await this.appService.executeOrderPlacement(req.body);
    return res.json(result);
  }
}
