/**
 * Minimal PNG → ICO converter.
 * Reads icon.png and writes icon.ico (256x256 embedded PNG inside ICO).
 * No external deps needed - modern Windows supports PNG-in-ICO.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '..', 'public', 'icon.png');
const DST = path.join(__dirname, '..', 'public', 'icon.ico');

const pngBuf = fs.readFileSync(SRC);

// ICO format: ICONDIR + ICONDIRENTRY + image data
// Windows supports PNG-in-ICO (Vista+), so we just embed the PNG directly.
const WIDTH  = 256; // reported size
const HEIGHT = 256;
const PLANES = 1;
const BPP    = 32;   // bits per pixel

const ICONDIR_SIZE    = 6;  // header: reserved(2) + type(2) + count(2)
const ICONDIRENTRY_SZ = 16; // each entry

const imageOffset = ICONDIR_SIZE + ICONDIRENTRY_SZ; // 22

// ICONDIR
const icondir = Buffer.alloc(ICONDIR_SIZE);
icondir.writeUInt16LE(0, 0);      // Reserved
icondir.writeUInt16LE(1, 2);      // Type: 1 = ICO
icondir.writeUInt16LE(1, 4);      // Count: 1 image

// ICONDIRENTRY
const entry = Buffer.alloc(ICONDIRENTRY_SZ);
entry.writeUInt8(0,  0);          // Width (0 = 256)
entry.writeUInt8(0,  1);          // Height (0 = 256)
entry.writeUInt8(0,  2);          // Color count (0 = no palette)
entry.writeUInt8(0,  3);          // Reserved
entry.writeUInt16LE(PLANES, 4);
entry.writeUInt16LE(BPP,    6);
entry.writeUInt32LE(pngBuf.length, 8);  // Size of image data
entry.writeUInt32LE(imageOffset,  12);  // Offset of image data

const ico = Buffer.concat([icondir, entry, pngBuf]);
fs.writeFileSync(DST, ico);
console.log(`✅  icon.ico created (${(ico.length / 1024).toFixed(1)} KB)`);
