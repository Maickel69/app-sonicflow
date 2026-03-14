import fs from 'fs';
import path from 'path';
import os from 'os';

export const TEMP_DIR = path.join(os.tmpdir(), 'SonicFlow-Temp');

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

export const sanitizeFilename = (name) => {
    // Allow alphanumeric, spaces, dots, dashes, underscores, and Spanish characters (ñ, Ñ, accents)
    return name.replace(/[^a-zA-Z0-9\s.\-_ñÑáéíóúÁÉÍÓÚ]/g, '').trim().replace(/\s+/g, ' ');
};

export const cleanTempDir = () => {
    try {
        if (fs.existsSync(TEMP_DIR)) {
            const files = fs.readdirSync(TEMP_DIR);
            for (const file of files) {
                fs.unlinkSync(path.join(TEMP_DIR, file));
            }
        }
    } catch (e) {
        console.error('Startup cleanup error:', e);
    }
};
