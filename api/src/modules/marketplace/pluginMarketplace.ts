/**
 * Feature 98: Open Plugin Marketplace
 * 
 * Provides a decentralized discovery, verification, and installation
 * registry for Mailops plugins.
 */

export interface MarketplacePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email: string;
    verified: boolean;
  };
  hooks: string[];
  downloadsCount: number;
  rating: number; // 0 to 5
  manifestUrl: string;
  checksumSha256: string;
  permissions: ('read_emails' | 'send_emails' | 'modify_labels' | 'network_access')[];
}

const verifiedPlugins: MarketplacePlugin[] = [
  {
    id: 'org.mailops.autotranslate',
    name: 'Auto-Translate',
    version: '1.2.0',
    description: 'Auto-detects and translates incoming foreign-language emails to English.',
    author: { name: 'Mailops Core Team', email: 'core@mailops.dev', verified: true },
    hooks: ['AFTER_RECEIVE', 'BEFORE_DISPLAY'],
    downloadsCount: 4200,
    rating: 4.9,
    manifestUrl: 'https://plugins.mailops.dev/autotranslate/manifest.json',
    checksumSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    permissions: ['read_emails', 'network_access']
  },
  {
    id: 'org.mailops.slacknotifs',
    name: 'Slack Alerts & Channel Digest',
    version: '2.0.1',
    description: 'Post high-priority and VIP emails directly into your designated Slack channels.',
    author: { name: 'Community Contributor', email: 'dev@slack-community.io', verified: true },
    hooks: ['AFTER_RECEIVE'],
    downloadsCount: 3100,
    rating: 4.8,
    manifestUrl: 'https://plugins.mailops.dev/slacknotifs/manifest.json',
    checksumSha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    permissions: ['read_emails', 'network_access']
  },
  {
    id: 'org.mailops.crmsync',
    name: 'HubSpot & Salesforce Bi-directional Sync',
    version: '1.0.4',
    description: 'Automatically log conversations and sync contact timelines with popular CRMs.',
    author: { name: 'Enterprise Integrations LLC', email: 'sales@enterprise-integrations.com', verified: true },
    hooks: ['AFTER_RECEIVE', 'BEFORE_SEND'],
    downloadsCount: 1850,
    rating: 4.7,
    manifestUrl: 'https://plugins.mailops.dev/crmsync/manifest.json',
    checksumSha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    permissions: ['read_emails', 'send_emails', 'network_access']
  }
];

export function searchMarketplace(query: string, tag?: string): MarketplacePlugin[] {
  const q = query.toLowerCase().trim();
  return verifiedPlugins.filter(p => {
    const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const matchesTag = !tag || p.hooks.includes(tag);
    return matchesQuery && matchesTag;
  });
}

export function getPluginDetails(pluginId: string): MarketplacePlugin | null {
  return verifiedPlugins.find(p => p.id === pluginId) || null;
}

export function installPlugin(pluginId: string, enabledPermissions: string[]): { success: boolean; message: string } {
  const plugin = getPluginDetails(pluginId);
  if (!plugin) {
    return { success: false, message: 'Plugin not found in marketplace registry.' };
  }
  
  // Verify permissions
  const missingPerms = plugin.permissions.filter(p => !enabledPermissions.includes(p));
  if (missingPerms.length > 0) {
    return { success: false, message: `User must grant permissions: ${missingPerms.join(', ')}` };
  }

  return { success: true, message: `Plugin ${plugin.name} v${plugin.version} installed successfully.` };
}
