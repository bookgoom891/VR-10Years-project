import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, openSync, closeSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const url = 'http://127.0.0.1:5173/';
const chromePaths = [
  resolve(process.env.PROGRAMFILES || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe'),
  resolve(process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)', 'Google/Chrome/Application/chrome.exe'),
  resolve(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe')
];

async function isReady() {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return response.ok && (await response.text()).includes('VR');
  } catch {
    return false;
  }
}

if (!(await isReady())) {
  const logs = resolve(projectRoot, 'work');
  mkdirSync(logs, { recursive: true });
  const output = openSync(resolve(logs, 'vr-autostart.log'), 'a');
  const server = spawn(process.execPath, [
    resolve(projectRoot, 'node_modules/vite/bin/vite.js'),
    '--host', '127.0.0.1', '--port', '5173', '--strictPort'
  ], { cwd: projectRoot, detached: true, windowsHide: true, stdio: ['ignore', output, output] });
  server.unref();
  closeSync(output);
}

let ready = false;
for (let attempt = 0; attempt < 45; attempt += 1) {
  if (await isReady()) {
    ready = true;
    break;
  }
  await new Promise((done) => setTimeout(done, 1000));
}

if (!ready) throw new Error('VR server did not become ready on port 5173.');
if (!process.argv.includes('--no-browser')) {
  const chrome = chromePaths.find(existsSync);
  if (!chrome) throw new Error('Google Chrome was not found.');
  const browser = spawn(chrome, [url], { detached: true, stdio: 'ignore' });
  browser.unref();
}
console.log(`VR ready: ${url}`);
