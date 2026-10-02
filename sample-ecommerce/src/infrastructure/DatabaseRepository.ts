export class DatabaseRepository {
  public async executeQuery(sql: string) {
    console.log(`Executing SQL Query: ${sql}`);
    return [{ id: 'USR-101', name: 'Alex Johnson', email: 'alex@example.com' }];
  }
}
