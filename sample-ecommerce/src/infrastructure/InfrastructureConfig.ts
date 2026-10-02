export class InfrastructureConfig {
  public getDatabaseUri(): string {
    return 'postgresql://user:pass@db.internal:5432/ecommerce_db';
  }
}
