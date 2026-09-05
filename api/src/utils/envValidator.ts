export function validateEnv(env: Record<string, string | undefined>, requiredKeys: string[]) {
  const missing: string[] = [];

  for (const key of requiredKeys) {
    if (!env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return true;
}
