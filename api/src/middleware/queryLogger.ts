export class LoggedDB {
  constructor(private db: any) {}

  prepare(query: string) {
    const stmt = this.db.prepare(query);
    
    return {
      bind: (...params: any[]) => {
        const bound = stmt.bind(...params);
        return this.wrapStmt(bound, query);
      },
      ...this.wrapStmt(stmt, query)
    };
  }
  
  private wrapStmt(stmt: any, query: string) {
    return {
      all: async () => this.measure(query, () => stmt.all()),
      run: async () => this.measure(query, () => stmt.run()),
      first: async () => this.measure(query, () => stmt.first())
    };
  }

  private async measure(query: string, fn: () => Promise<any>) {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      const duration = Date.now() - start;
      if (duration > 100) {
        console.warn(`[SLOW QUERY] ${duration}ms: ${query}`);
        // Optionally run EXPLAIN here if supported by DB
      }
    }
  }
}
