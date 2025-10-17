import { copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const distDir = resolve('dist');
const source = resolve(distDir, 'index.html');
const destination = resolve(distDir, '404.html');

try {
  await copyFile(source, destination);
  console.log(`Copied ${source} -> ${destination}`);
} catch (error) {
  console.error('Failed to copy 404.html from index.html:', error);
  process.exitCode = 1;
}
