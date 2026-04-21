const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3030;
const CONFIG_FILE = path.join(__dirname, 'config', 'sites.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Config helpers
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return { sites: [] };
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

function saveConfig(data) {
  if (!fs.existsSync(path.join(__dirname, 'config'))) {
    fs.mkdirSync(path.join(__dirname, 'config'));
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

// ── Stream command output via SSE
function streamCommand(cmd, res, opts = {}) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (type, data) => res.write(`data: ${JSON.stringify({ type, data })}\n\n`);

  send('cmd', cmd);

  const proc = exec(cmd, { maxBuffer: 1024 * 1024 * 20, ...opts });
  proc.stdout.on('data', d => send('out', d.toString().trim()));
  proc.stderr.on('data', d => send('err', d.toString().trim()));
  proc.on('close', code => {
    send(code === 0 ? 'success' : 'fail', code === 0 ? 'Done!' : `Failed with exit code ${code}`);
    res.end();
  });
  proc.on('error', err => { send('fail', err.message); res.end(); });
}

// ── ROUTES ──────────────────────────────────────────

// Get all saved sites
app.get('/api/sites', (req, res) => res.json(loadConfig()));

// Save a site
app.post('/api/sites', (req, res) => {
  const config = loadConfig();
  const existing = config.sites.findIndex(s => s.id === req.body.id);
  if (existing >= 0) {
    config.sites[existing] = req.body;
  } else {
    config.sites.push({ id: Date.now().toString(), ...req.body });
  }
  saveConfig(config);
  res.json({ success: true });
});

// Delete a site
app.delete('/api/sites/:id', (req, res) => {
  const config = loadConfig();
  config.sites = config.sites.filter(s => s.id !== req.params.id);
  saveConfig(config);
  res.json({ success: true });
});

// Test SSH connection
app.post('/api/test-ssh', (req, res) => {
  const { sshUser, sshHost, sshPort = 22, sshKey } = req.body;
  const key = sshKey ? `-i "${sshKey}"` : '';
  const cmd = `ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p ${sshPort} ${key} ${sshUser}@${sshHost} "echo SSH_OK"`;
  streamCommand(cmd, res);
});

// Pull DB from live → local
app.post('/api/db/pull', (req, res) => {
  const { sshUser, sshHost, sshPort = 22, sshKey, remotePath, localPath, liveUrl, localUrl } = req.body;
  const key = sshKey ? `-i "${sshKey}"` : '';
  const stamp = Date.now();
  const cmd = [
    `ssh -o StrictHostKeyChecking=no -p ${sshPort} ${key} ${sshUser}@${sshHost} "cd ${remotePath} && wp db export /tmp/synpress_${stamp}.sql --allow-root"`,
    `scp -P ${sshPort} ${key} ${sshUser}@${sshHost}:/tmp/synpress_${stamp}.sql /tmp/synpress_${stamp}.sql`,
    `cd "${localPath}" && wp db import /tmp/synpress_${stamp}.sql --allow-root`,
    `cd "${localPath}" && wp search-replace "${liveUrl}" "${localUrl}" --allow-root`,
    `rm /tmp/synpress_${stamp}.sql`,
    `ssh -o StrictHostKeyChecking=no -p ${sshPort} ${key} ${sshUser}@${sshHost} "rm /tmp/synpress_${stamp}.sql"`
  ].join(' && ');
  streamCommand(cmd, res);
});

// Push DB from local → live
app.post('/api/db/push', (req, res) => {
  const { sshUser, sshHost, sshPort = 22, sshKey, remotePath, localPath, liveUrl, localUrl } = req.body;
  const key = sshKey ? `-i "${sshKey}"` : '';
  const stamp = Date.now();
  const cmd = [
    `cd "${localPath}" && wp db export /tmp/synpress_${stamp}.sql --allow-root`,
    `scp -P ${sshPort} ${key} /tmp/synpress_${stamp}.sql ${sshUser}@${sshHost}:/tmp/synpress_${stamp}.sql`,
    `ssh -o StrictHostKeyChecking=no -p ${sshPort} ${key} ${sshUser}@${sshHost} "cd ${remotePath} && wp db import /tmp/synpress_${stamp}.sql --allow-root && wp search-replace '${localUrl}' '${liveUrl}' --allow-root && rm /tmp/synpress_${stamp}.sql"`,
    `rm /tmp/synpress_${stamp}.sql`
  ].join(' && ');
  streamCommand(cmd, res);
});

// Git pull
app.post('/api/git/pull', (req, res) => {
  const { localPath, branch = 'main' } = req.body;
  streamCommand(`cd "${localPath}" && git pull origin ${branch}`, res);
});

// Git push
app.post('/api/git/push', (req, res) => {
  const { localPath, branch = 'main', message = 'Synpress deploy' } = req.body;
  const cmd = `cd "${localPath}" && git add -A && git commit -m "${message}" && git push origin ${branch}`;
  streamCommand(cmd, res);
});

// Git status
app.post('/api/git/status', (req, res) => {
  const { localPath } = req.body;
  streamCommand(`cd "${localPath}" && git status && echo "---" && git log --oneline -10`, res);
});

// ── START
app.listen(PORT, () => {
  console.log(`\n⚡ Synpress running at http://localhost:${PORT}\n`);
});
