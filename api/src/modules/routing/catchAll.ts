import { D1Database } from '@cloudflare/workers-types';
import { nanoid } from 'nanoid';

export interface CatchAllConfig {
  domainId: string;
  targetFolder: string;
  isEnabled: boolean;
}

export class CatchAllModule {
  constructor(private db: D1Database) {}

  async configureCatchAll(domainId: string, targetFolder: string, isEnabled: boolean): Promise<CatchAllConfig> {
    await this.db.prepare(
      \`INSERT INTO catchall_config (domain_id, target_folder, is_enabled)
       VALUES (?, ?, ?)
       ON CONFLICT(domain_id) DO UPDATE SET target_folder=excluded.target_folder, is_enabled=excluded.is_enabled\`
    ).bind(domainId, targetFolder, isEnabled ? 1 : 0).run();

    return { domainId, targetFolder, isEnabled };
  }

  async getCatchAllConfig(domainId: string): Promise<CatchAllConfig | null> {
    const row = await this.db.prepare(
      \`SELECT domain_id as domainId, target_folder as targetFolder, is_enabled as isEnabled
       FROM catchall_config WHERE domain_id = ?\`
    ).bind(domainId).first<CatchAllConfig>();

    if (!row) return null;
    return { ...row, isEnabled: Boolean(row.isEnabled) };
  }

  async routeInboundEmail(toAddress: string, domainId: string, aliasResolver: (domainId: string, addr: string) => Promise<string | null>): Promise<{ route: string, type: 'exact' | 'plus' | 'catchall' | 'reject' }> {
    const localPart = toAddress.split('@')[0];
    
    // 1. Exact match
    const exact = await aliasResolver(domainId, localPart);
    if (exact) return { route: exact, type: 'exact' };

    // 2. Plus addressing
    if (localPart.includes('+')) {
      const base = localPart.split('+')[0];
      const plusBase = await aliasResolver(domainId, base);
      if (plusBase) return { route: plusBase, type: 'plus' };
    }

    // 3. Catch-all
    const config = await this.getCatchAllConfig(domainId);
    if (config && config.isEnabled) {
      this.logCatchAllCapture(domainId, toAddress);
      return { route: config.targetFolder, type: 'catchall' };
    }

    return { route: 'reject', type: 'reject' };
  }

  private async logCatchAllCapture(domainId: string, toAddress: string) {
    const id = nanoid();
    await this.db.prepare(
      \`INSERT INTO catchall_logs (id, domain_id, captured_address, captured_at) VALUES (?, ?, ?, ?)\`
    ).bind(id, domainId, toAddress, Date.now()).run();
  }
}
