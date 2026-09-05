export interface Migration {
  id: string;
  up: (db: any) => Promise<void>;
  down: (db: any) => Promise<void>;
}

export class MigrationManager {
  private db: any;
  private migrations: Migration[] = [];

  constructor(db: any) {
    this.db = db;
  }

  register(migration: Migration) {
    this.migrations.push(migration);
  }

  async init() {
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id TEXT PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  }

  async getMigrationStatus() {
    await this.init();
    const applied = await this.db.prepare('SELECT id FROM _migrations').all();
    const appliedIds = new Set(applied.results.map((r: any) => r.id));
    
    return this.migrations.map(m => ({
      id: m.id,
      applied: appliedIds.has(m.id)
    }));
  }

  async runMigrations() {
    await this.init();
    const status = await this.getMigrationStatus();
    const pending = status.filter(m => !m.applied);

    for (const m of pending) {
      const migration = this.migrations.find(mig => mig.id === m.id);
      if (migration) {
        console.log(`Running migration ${m.id}`);
        await migration.up(this.db);
        await this.db.prepare('INSERT INTO _migrations (id) VALUES (?)').bind(m.id).run();
      }
    }
    console.log('All migrations applied');
  }

  async rollbackMigration(id: string) {
    await this.init();
    const migration = this.migrations.find(m => m.id === id);
    if (!migration) {
      throw new Error(`Migration ${id} not found`);
    }

    const { results } = await this.db.prepare('SELECT * FROM _migrations WHERE id = ?').bind(id).all();
    if (results.length === 0) {
      throw new Error(`Migration ${id} has not been applied`);
    }

    console.log(`Rolling back migration ${id}`);
    await migration.down(this.db);
    await this.db.prepare('DELETE FROM _migrations WHERE id = ?').bind(id).run();
  }
}
