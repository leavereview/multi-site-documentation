import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadConfig(configPath) {
  const fullPath = resolve(__dirname, '../../', configPath || 'config.json');
  const content = await readFile(fullPath, 'utf8');
  return JSON.parse(content);
}

export function expandPath(path) {
  if (path.startsWith('~/')) {
    return path.replace('~', process.env.HOME);
  }
  return path;
}

export function getDomainConfig(config, domainName) {
  const domain = config.domains.find(d => d.name === domainName && d.enabled);
  if (!domain) {
    throw new Error(`Domain ${domainName} not found or not enabled in config`);
  }
  return domain;
}
