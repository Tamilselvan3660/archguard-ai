// INTENTIONAL BOUNDARY BREACH DRIFT-003: Domain importing InfrastructureConfig directly!
import { InfrastructureConfig } from '../infrastructure/InfrastructureConfig';

export class UserService {
  private config: InfrastructureConfig;

  constructor() {
    this.config = new InfrastructureConfig();
  }

  public async getUser(userId: string) {
    // Domain should be pure business logic, not accessing DB connection strings directly
    const dbUri = this.config.getDatabaseUri();
    return { id: userId, name: 'Alex Johnson', email: 'alex@example.com', dbUri };
  }
}
