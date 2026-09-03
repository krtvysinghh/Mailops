export enum PluginHook {
  BEFORE_SEND = 'BEFORE_SEND',
  AFTER_RECEIVE = 'AFTER_RECEIVE',
  BEFORE_DISPLAY = 'BEFORE_DISPLAY',
  ON_COMPOSE = 'ON_COMPOSE',
  ON_SEARCH = 'ON_SEARCH',
  ON_LABEL = 'ON_LABEL',
  ON_DELETE = 'ON_DELETE'
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  hooks: Partial<Record<PluginHook, PluginHandler>>;
  priority?: number;
}

export type PluginHandler = (context: any) => Promise<any> | any;

export interface PluginRegistration extends PluginManifest {
  enabled: boolean;
  priority: number;
}

export class PluginManager {
  private plugins: Map<string, PluginRegistration> = new Map();

  registerPlugin(manifest: PluginManifest): void {
    if (!this.validatePluginManifest(manifest)) {
      throw new Error(`Invalid plugin manifest for ${manifest.id || 'unknown'}`);
    }
    
    this.plugins.set(manifest.id, {
      ...manifest,
      enabled: true,
      priority: manifest.priority ?? 50
    });
  }

  async executeHook(hook: PluginHook, context: any): Promise<any> {
    const activePlugins = Array.from(this.plugins.values())
      .filter(p => p.enabled && p.hooks[hook])
      .sort((a, b) => b.priority - a.priority);

    let currentContext = { ...context };

    for (const plugin of activePlugins) {
      try {
        const handler = plugin.hooks[hook]!;
        // Sandboxed execution via try/catch
        const result = await Promise.resolve(handler(currentContext));
        if (result) {
          currentContext = { ...currentContext, ...result };
        }
      } catch (err) {
        console.error(`Plugin ${plugin.id} crashed on hook ${hook}:`, err);
        // Continue execution despite plugin failure
      }
    }

    return currentContext;
  }

  listPlugins(): PluginRegistration[] {
    return Array.from(this.plugins.values());
  }

  enablePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) plugin.enabled = true;
  }

  disablePlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) plugin.enabled = false;
  }

  validatePluginManifest(manifest: any): manifest is PluginManifest {
    return (
      manifest &&
      typeof manifest.id === 'string' &&
      typeof manifest.name === 'string' &&
      typeof manifest.version === 'string' &&
      typeof manifest.hooks === 'object'
    );
  }
}

export const pluginSystem = new PluginManager();

/* Example Plugins

const AutoTranslatePlugin: PluginManifest = {
  id: 'core.autotranslate',
  name: 'Auto Translate',
  version: '1.0.0',
  description: 'Automatically translates incoming emails',
  author: 'Mailops Team',
  priority: 90,
  hooks: {
    [PluginHook.AFTER_RECEIVE]: async (context) => {
      // call translation API
      return { translatedBody: '...' };
    }
  }
};

const CRMSyncPlugin: PluginManifest = {
  id: 'core.crmsync',
  name: 'CRM Sync',
  version: '1.0.0',
  description: 'Syncs contacts to CRM',
  author: 'Mailops Team',
  hooks: {
    [PluginHook.AFTER_RECEIVE]: async (context) => {
      // sync to CRM
    }
  }
};

const SlackNotifierPlugin: PluginManifest = {
  id: 'core.slacknotify',
  name: 'Slack Notifier',
  version: '1.0.0',
  description: 'Sends slack message on urgent emails',
  author: 'Mailops Team',
  hooks: {
    [PluginHook.AFTER_RECEIVE]: async (context) => {
      // check if urgent and send slack msg
    }
  }
};
*/
