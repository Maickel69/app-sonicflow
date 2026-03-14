import spotifyUrlInfo from 'spotify-url-info';
const { getData, getTracks } = spotifyUrlInfo(fetch);

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import YTDlexec from 'youtube-dl-exec';

// Internal modules
import { loadConfig, saveConfig } from './configManager.js';
import { TEMP_DIR, sanitizeFilename, cleanTempDir } from './utils.js';

// ── Paths ────────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IS_ELECTRON = !!process.env.ELECTRON_APP;

// ELECTRON_DIST_DIR is set by electron/main.js and points to the REAL (unpacked)
// dist/ folder that Express.static() can serve filesystem files from.
// In dev/web mode it falls back to the sibling dist/ folder.
const DIST_DIR = process.env.ELECTRON_DIST_DIR
    || path.join(__dirname, '..', 'dist');

console.log(`[Server] IS_ELECTRON=${IS_ELECTRON} | DIST_DIR=${DIST_DIR} | exists=${fs.existsSync(DIST_DIR)}`);

// --- Fix for Windows paths with spaces ---
// youtube-dl-exec uses tinyspawn, which splits full paths with spaces incorrectly.
// By adding the bin folder to PATH, we can just spawn 'yt-dlp.exe' securely.
const ytdlBinDir = path.join(__dirname, '..', 'node_modules', 'youtube-dl-exec', 'bin');
process.env.PATH = `${ytdlBinDir}${path.delimiter}${process.env.PATH}`;

const youtubedl = YTDlexec.create(process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

const app = express();
app.use(cors());
app.use(express.json());

// ── Serve built frontend (Electron / production) ──────────────────────────
if (IS_ELECTRON && fs.existsSync(DIST_DIR)) {
    app.use(express.static(DIST_DIR));
}

// Startup Cleanup
cleanTempDir();

// --- API Endpoints ---

// 1. Get Config
app.get('/api/config', (req, res) => {
    res.json(loadConfig());
});

// 2. Update Config (Manual)
app.post('/api/config', (req, res) => {
    try {
        const { downloadPath } = req.body;
        if (downloadPath) {
            const config = saveConfig({ downloadPath });
            res.json({ success: true, config });
        } else {
            res.status(400).json({ error: 'Invalid config parameters' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Failed to save config' });
    }
});

// 3. Choose Directory (Native Dialog)
app.post('/api/choose-directory', (req, res) => {
    console.log('[API] Request to open folder dialog received');

    // Simplified PowerShell script that works more reliably
    // Using Base64 encoded command to avoid line-ending and quote escaping issues

    // Determine initial directory
    const config = loadConfig();
    let initialPath = config.downloadPath;

    // Use environment variables for robust fallbacks
    // If configured path is missing/invalid, fallback to User Downloads
    if (!initialPath || !fs.existsSync(initialPath)) {
        const userProfile = process.env.USERPROFILE || process.env.HOME || 'C:\\';
        const downloadsPath = path.join(userProfile, 'Downloads');

        if (fs.existsSync(downloadsPath)) {
            initialPath = downloadsPath;
        } else {
            initialPath = userProfile;
        }
    }

    let psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
Add-Type -AssemblyName System.Windows.Forms;
$f = New-Object System.Windows.Forms.FolderBrowserDialog;
$f.Description = "Selecciona la carpeta de descargas";
$f.ShowNewFolderButton = $true;
$f.RootFolder = "Desktop";
`;

    if (initialPath) {
        // PowerShell strings double-quote escaping is ""
        const safePath = initialPath.replace(/"/g, '""');
        psScript += `$f.SelectedPath = "${safePath}";\n`;
    }

    psScript += `
$form = New-Object System.Windows.Forms.Form;
$form.TopMost = $true;
$form.WindowState = "Minimized";
$form.ShowInTaskbar = $false;
$result = $f.ShowDialog($form);
if ($result -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $f.SelectedPath };
$form.Dispose();
`;

    // Convert script to UTF-16LE Base64 (required for PowerShell -EncodedCommand)
    const encodedCommand = Buffer.from(psScript, 'utf16le').toString('base64');

    // Run PowerShell with EncodedCommand (implicitly STA in modern PS, but explicit -Sta good for older)
    // Actually -EncodedCommand handles complex scripts better than passed -Command strings
    const child = spawn('powershell.exe', [
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-EncodedCommand', encodedCommand
    ], {
        windowsHide: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
        stdout += data.toString('utf8');
    });

    child.stderr.on('data', (data) => {
        stderr += data.toString('utf8');
        console.error('[PowerShell Error]:', data.toString('utf8'));
    });

    child.on('close', (code) => {
        const selectedPath = stdout.trim();
        console.log('[API] Dialog closed. Code:', code, 'Path:', selectedPath);

        if (selectedPath && code === 0) {
            // Verify the path exists
            if (fs.existsSync(selectedPath)) {
                saveConfig({ downloadPath: selectedPath });
                res.json({ success: true, path: selectedPath });
            } else {
                res.status(500).json({ error: 'Selected path does not exist' });
            }
        } else {
            if (code === 0 && !selectedPath) {
                res.json({ success: false, message: 'Cancelled' });
            } else {
                res.status(500).json({
                    error: 'Failed to open dialog',
                    details: stderr || 'No error details available',
                    code: code
                });
            }
        }
    });

    child.on('error', (err) => {
        console.error('[Spawn Error]', err);
        res.status(500).json({
            error: 'Failed to spawn PowerShell process',
            details: err.message
        });
    });
});

// 4. Get Video Info
app.get('/api/info', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'Invalid URL' });

        console.log(`[Info] Fetching for: ${url}`);

        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificates: true,
            skipDownload: true,
        });

        res.json({
            title: info.title,
            thumbnail: info.thumbnail,
            lengthSeconds: info.duration,
            author: info.uploader,
            viewCount: info.view_count
        });

    } catch (err) {
        console.error('[Info Error]', err.message);
        res.status(500).json({ error: 'Failed to fetch video info. Please check the URL.' });
    }
});

// 5. Search Artist Top Hits
app.get('/api/artist-hits', async (req, res) => {
    try {
        const { artist } = req.query;
        if (!artist) return res.status(400).json({ error: 'Artist name required' });

        const cleanArtist = artist.trim();
        console.log(`[Artist Hits] Searching for: "${cleanArtist}"`);
        console.time('[Artist Hits] Time');

        let playlistTitle = `${cleanArtist} - Top Songs`;
        let playlistThumb = '';

        // Use YouTube Topic channels for clean, official artist tracks
        console.log('[Artist Hits] Searching YouTube Topic for top tracks...');
        const searchResult = await youtubedl(`ytsearch25:${cleanArtist} topic`, {
            dumpSingleJson: true,
            flatPlaylist: true,
            noWarnings: true,
            noCheckCertificates: true,
            skipDownload: true
        });

        const entries = searchResult.entries || (searchResult.id ? [searchResult] : []);


        // Filter and clean results - exclude mixes, compilations, and long videos
        const items = entries
            .filter(item => {
                // Filter by duration: songs between 1-10 minutes (60-600 seconds)
                if (!item.duration || item.duration < 60 || item.duration > 600) {
                    return false;
                }

                const title = (item.title || '').toLowerCase();

                // Exclude mixes, compilations, best of, etc.
                const excludePatterns = [
                    'live', 'cover', 'reaction', 'tutorial', 'karaoke',
                    'mix 20', 'mix20', 'mejores', 'best of', 'best hits',
                    'compilation', 'álbum', 'album completo', 'full album',
                    'playlist', 'las mejores', 'top ', 'greatest hits',
                    'extended', 'hour', 'hora', 'minutos de', 'minutes of'
                ];

                for (const pattern of excludePatterns) {
                    if (title.includes(pattern)) {
                        return false;
                    }
                }

                return true;
            })
            ;

        // --- Smart Split Logic for Mixes ---
        // Detect videos > 5 mins that look like lists of songs (semicolons, commas, pipes)
        const itemsToProcess = [];
        const extraSearches = [];

        for (const item of items) {
            const t = item.title;
            // Heuristic: Duration > 300s (5min) AND contains separators
            const isLong = item.duration > 300;
            const hasList = t.includes(',') || t.includes('|') || (t.match(/\s-\s/g) || []).length >= 2;

            // Should we split?
            let splitted = false;
            if (isLong && hasList) {
                const potentialTracks = t.split(/,|\||\s-\s|\s\/\s/g)
                    .map(s => s.trim())
                    .filter(s => s.length > 3 &&
                        !s.toLowerCase().includes('video') &&
                        !s.toLowerCase().includes('mix') &&
                        !s.toLowerCase().includes('full album') &&
                        // Avoid parts that are just the artist name
                        s.toLowerCase() !== cleanArtist.toLowerCase());

                if (potentialTracks.length >= 2) {
                    console.log(`[Artist Hits] Splitting mix: "${t}" -> [${potentialTracks.join(', ')}]`);
                    splitted = true;

                    for (let i = 0; i < potentialTracks.length; i++) {
                        const trackName = potentialTracks[i];
                        // Safety cap
                        if (extraSearches.length > 8) break;

                        extraSearches.push(
                            youtubedl(`ytsearch1:${cleanArtist} - ${trackName}`, {
                                dumpSingleJson: true,
                                noWarnings: true,
                                flatPlaylist: true,
                                skipDownload: true
                            }).then(r => {
                                const send = r.entries ? r.entries[0] : r;
                                // Only accept if duration is reasonable (song length: 2-6 mins)
                                if (send && send.title && send.duration > 60 && send.duration < 420) {
                                    return send;
                                }
                                return null;
                            }).catch(() => null)
                        );
                    }
                }
            }

            if (!splitted) {
                itemsToProcess.push(item);
            }
        }

        if (extraSearches.length > 0) {
            try {
                const results = await Promise.all(extraSearches);
                const validResults = results.filter(r => r !== null);
                if (validResults.length > 0) {
                    console.log(`[Artist Hits] Added ${validResults.length} individual tracks from mixes.`);
                    itemsToProcess.push(...validResults);
                }
            } catch (e) { console.error('Split search error:', e); }
        }

        // Advanced Deduplication Logic
        const uniqueItems = [];
        const seenTitles = new Set();

        const normalize = (str) => {
            return str.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(new RegExp(cleanArtist.toLowerCase(), 'g'), '')
                .replace(/official video|video oficial|video lyric|letra|lyrics|visualizer|official audio|ft|feat/g, '')
                .replace(/[^a-z0-9ñáéíóú]/g, '');
        };

        for (const item of itemsToProcess) {
            const rawTitle = item.title;
            const normTitle = normalize(rawTitle);

            if (normTitle.length < 3) continue;

            let isDuplicate = false;
            for (const seen of seenTitles) {
                if (seen.includes(normTitle) || normTitle.includes(seen)) {
                    isDuplicate = true;
                    break;
                }
            }

            if (!isDuplicate) {
                uniqueItems.push(item);
                seenTitles.add(normTitle);
            }
        }

        const finalItems = uniqueItems
            .slice(0, 15)
            .map(item => ({
                title: item.title,
                url: item.url || item.webpage_url || `https://www.youtube.com/watch?v=${item.id}`,
                duration: item.duration,
                thumbnail: item.thumbnails ? item.thumbnails[0].url : (item.thumbnail || null),
                author: item.uploader || item.channel || cleanArtist
            }));

        if (finalItems.length > 0) {
            playlistThumb = finalItems[0].thumbnail;
        }

        console.timeEnd('[Artist Hits] Time');

        if (finalItems.length === 0) {
            return res.status(404).json({ error: 'No se encontraron canciones. Prueba con otro nombre.' });
        }

        res.json({
            title: playlistTitle,
            thumbnail: playlistThumb,
            items: finalItems
        });

    } catch (err) {
        console.error('[Artist Hits Error]', err);
        const details = `Msg: ${err.message} | Code: ${err.code} | stderr: ${err.stderr} | Raw: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`;
        res.status(500).json({ error: `Debug Detail: ${details}` });
    }
});

// 5.5 Suggestions Endpoint
app.get('/api/suggestions', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        const response = await fetch(`http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`);
        const data = await response.json();

        res.json(data[1] || []);
    } catch (err) {
        res.json([]);
    }
});

// 6. Get Playlist Info
app.get('/api/playlist', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'Invalid URL' });

        console.log(`[Playlist] Fetching for: ${url}`);
        console.time('[Playlist] Time');

        if (url.includes('spotify.com')) {
            // --- Spotify Logic ---
            const data = await getData(url);
            const tracks = await getTracks(url);

            const items = tracks.map((track, index) => {
                // Extended defensive thumbnail check
                const thumb = track.image ||
                    track.thumbnail ||
                    (track.album && track.album.images && track.album.images[0]?.url) ||
                    (track.coverArt && track.coverArt.sources && track.coverArt.sources[0]?.url) ||
                    (data.images && data.images[0]?.url) ||
                    (data.image) ||
                    '';

                if (index === 0) console.log('[Playlist] Sample track image property:', thumb ? 'Found' : 'Missing');

                return {
                    title: track.name || track.title || 'Unknown Track',
                    // Targeted search for clean official audio
                    url: `ytsearch1:${(track.artist || track.author || 'Unknown Artist')} - ${(track.name || track.title)} official audio`,
                    duration: Math.round((track.duration || track.duration_ms || 0) / (track.duration_ms ? 1000 : 1)),
                    thumbnail: thumb,
                    author: track.artist || track.author || 'Unknown Artist'
                };
            });

            console.log(`[Playlist] Mapping completed for ${items.length} items.`);
            const playlistThumb = data.images?.[0]?.url || data.image || (items[0]?.thumbnail) || '';

            res.json({
                title: data.name || data.title || 'Spotify Playlist',
                thumbnail: playlistThumb,
                items: items
            });

        } else {
            // --- YouTube Logic ---
            const output = await youtubedl(url, {
                dumpSingleJson: true,
                flatPlaylist: true,
                noWarnings: true,
                noCheckCertificates: true,
                skipDownload: true
            });

            const entries = output.entries || [];
            const items = entries.map(item => ({
                title: item.title,
                url: item.url || `https://www.youtube.com/watch?v=${item.id}`,
                duration: item.duration,
                thumbnail: item.thumbnails ? item.thumbnails[0].url : null,
                author: item.uploader
            }));

            res.json({
                title: output.title || 'Playlist',
                thumbnail: output.thumbnails ? output.thumbnails[0].url : '',
                items: items
            });
        }
        console.timeEnd('[Playlist] Time');

    } catch (err) {
        console.error('[Playlist Error]', err.message);
        res.status(500).json({ error: 'Failed to fetch playlist.' });
    }
});

// 6. Download Video/Audio
app.get('/api/download', async (req, res) => {
    const downloadId = Date.now().toString() + '-' + Math.floor(Math.random() * 10000);
    let tempPathPattern = path.join(TEMP_DIR, `${downloadId}.%(ext)s`);

    try {
        const { url, type, path: customPath, mode } = req.query;
        console.log(`[Download] Starting: ${url} (${type})`);

        if (!url) return res.status(400).json({ error: 'Invalid URL' });

        // Get info to deduce filename
        const info = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            skipDownload: true
        });

        const config = loadConfig();
        // Priority: customPath from query > config.downloadPath
        const downloadDir = customPath || config.downloadPath;

        // Ensure download directory exists
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }

        const safeTitle = sanitizeFilename(info.title || 'download');
        let finalFilename = `${safeTitle}.${type}`;
        let finalPath = path.join(downloadDir, finalFilename);

        console.log(`[Download] Target: ${finalFilename}`);

        // Prepare flags
        let flags = {
            noWarnings: true,
            noCheckCertificates: true,
            output: tempPathPattern,
            noPlaylist: true,
            retries: 10,
            // CRITICAL FIX: Use android player client to bypass YouTube 403 Forbidden errors
            // The 'android' client bypasses bot detection without needing browser cookies
            // Confirmed working: downloads complete without corruption
            extractorArgs: 'youtube:player_client=android',
        };

        if (type === 'mp3') {
            // Use yt-dlp to download best audio and convert to proper MP3
            // FFmpeg 8.0.1 is installed, so conversion is safe to use
            flags.extractAudio = true;
            flags.audioFormat = 'mp3';
            flags.audioQuality = '0';       // Best quality VBR
            flags.format = 'bestaudio/best'; // Best audio source
        } else {
            // Video: pre-merged single MP4 to avoid needing ffmpeg merge
            flags.format = 'best[ext=mp4]/best';
        }

        // Execute Download via yt-dlp
        await youtubedl(url, flags);

        // Wait for FFmpeg post-processing to finish writing the file
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Find the generated file (may be .mp3 or .mp3.part still processing)
        let tempFiles = fs.readdirSync(TEMP_DIR).filter(f => f.startsWith(downloadId) && !f.endsWith('.part'));

        // Retry finding the file a few times (FFmpeg may still be finishing)
        for (let i = 0; i < 10 && tempFiles.length === 0; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            tempFiles = fs.readdirSync(TEMP_DIR).filter(f => f.startsWith(downloadId) && !f.endsWith('.part'));
        }

        if (tempFiles.length === 0) {
            throw new Error('Download failed: Output file not found after waiting.');
        }

        // Pick the MP3 file if exists, otherwise first file
        const mp3File = tempFiles.find(f => f.endsWith('.mp3'));
        const generatedFile = mp3File || tempFiles[0];
        const generatedPath = path.join(TEMP_DIR, generatedFile);

        // Wait until the file is stable (not being written to)
        let previousSize = -1;
        for (let i = 0; i < 10; i++) {
            const currentSize = fs.statSync(generatedPath).size;
            if (currentSize === previousSize && currentSize > 100000) break;
            previousSize = currentSize;
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Use actual extension (should be .mp3 now)
        const actualExtension = path.extname(generatedFile).replace('.', '');
        finalFilename = `${safeTitle}.${actualExtension}`;
        finalPath = path.join(downloadDir, finalFilename);

        // Final size check
        const stats = fs.statSync(generatedPath);
        console.log(`[Download] File ready: ${finalFilename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

        if (stats.size < 100000) {
            throw new Error('Downloaded file is too small - likely incomplete or corrupt.');
        }

        const safeMode = (mode || '').trim().toLowerCase();
        console.log(`[Download] Params - URL: ${url}, Mode: ${safeMode}, CustomPath: ${customPath}`);

        if (safeMode === 'client') {
            res.download(generatedPath, finalFilename, (err) => {
                if (err) {
                    console.error('[Download] Send error:', err);
                    if (!res.headersSent) res.status(500).send('Error sending file');
                }
                // Cleanup temp file after sending
                try {
                    fs.unlinkSync(generatedPath);
                } catch (e) {
                    console.error('[Download] Cleanup error:', e);
                }
            });
            return;
        }

        // Move to Final Destination (Server Mode)
        if (fs.existsSync(finalPath)) {
            try {
                fs.unlinkSync(finalPath);
            } catch (e) {
                console.warn('[Download] Could not delete existing file:', e.message);
            }
        }

        try {
            fs.renameSync(generatedPath, finalPath);
        } catch (err) {
            if (err.code === 'EXDEV') {
                // Cross-device link not permitted (e.g. C: to D:)
                // Fallback: Copy and Delete
                console.log('[Download] Cross-device move detected. Copying...');
                fs.copyFileSync(generatedPath, finalPath);
                fs.unlinkSync(generatedPath);
            } else {
                throw err;
            }
        }

        console.log(`[Download] Success: ${finalPath}`);

        res.json({ status: 'success', message: 'Download completed', path: finalPath });

    } catch (err) {
        console.error('[Download Error]', err.message);
        res.status(500).json({ error: 'Download failed', details: err.message });
    } finally {
        // Cleanup specific temp files for this ID
        try {
            const tempFiles = fs.readdirSync(TEMP_DIR).filter(f => f.startsWith(downloadId));
            tempFiles.forEach(f => fs.unlinkSync(path.join(TEMP_DIR, f)));
        } catch (e) { /* ignore cleanup errors */ }
    }
});

// ── SPA Catch-all (must be AFTER all /api routes) ────────────────────────
// NOTE: Express 5 (path-to-regexp v8+) no longer supports bare '*' in routes.
// Using app.use() as catch-all middleware bypasses path-to-regexp entirely.
if (IS_ELECTRON && fs.existsSync(DIST_DIR)) {
    const indexHtml = path.join(DIST_DIR, 'index.html');
    app.use((req, res) => {
        res.sendFile(indexHtml);
    });
}

const PORT = 3000;
// In Electron mode, only listen on localhost for security
const HOST = IS_ELECTRON ? '127.0.0.1' : '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`\n=== SonicFlow Server Listening on ${HOST}:${PORT} ===`);
    console.log(`Downloads will be saved to: ${loadConfig().downloadPath}`);
});
