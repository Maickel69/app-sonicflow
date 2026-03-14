import fs from 'fs';
import path from 'path';
import os from 'os';

// ── Config File Path ────────────────────────────────────────────────────────
// In Electron, SONICFLOW_CONFIG_DIR is set to app.getPath('userData')
// so the config survives app updates / reinstalls.
// In dev/web mode, it falls back to the server folder.
const configDir = process.env.SONICFLOW_CONFIG_DIR
  || path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');

const CONFIG_FILE = path.join(configDir, 'sonicflow-config.json');

// ── Default Config ──────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  downloadPath: path.join(os.homedir(), 'Downloads', 'SonicFlow'),
};

// Ensure the config directory exists (important for userData path)
try {
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
} catch (_) {}

// Create default config if not present
if (!fs.existsSync(CONFIG_FILE)) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
  } catch (e) {
    console.error('Failed to create initial config file:', e);
  }
}

// ── Load Config ─────────────────────────────────────────────────────────────
export const loadConfig = () => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Error loading config:', e);
  }
  return { ...DEFAULT_CONFIG };
};

// ── Save Config ─────────────────────────────────────────────────────────────
export const saveConfig = (newConfig) => {
  try {
    const current = loadConfig();
    const updated = { ...current, ...newConfig };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));
    return updated;
  } catch (e) {
    console.error('Error saving config:', e);
    throw e;
  }
};
