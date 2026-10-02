import { OrderService } from '../domain/OrderService';
import { UserService } from '../domain/UserService';

export class OrderApplicationService {
  private orderService: OrderService;
  private userService: UserService;

  constructor() {
    this.orderService = new OrderService();
    this.userService = new UserService();
  }

  public async executeOrderPlacement(orderPayload: any) {
    const user = await this.userService.getUser(orderPayload.userId);
    return await this.orderService.placeOrder(user, orderPayload.items);
  }
}
