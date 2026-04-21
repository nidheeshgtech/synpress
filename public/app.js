// ── Synpress Frontend API connector

const API = 'http://localhost:3030/api';
let activeSite = null;

// Load sites from backend on startup
async function loadSites() {
  try {
    const res = await fetch(`${API}/sites`);
    const data = await res.json();
    if (data.sites && data.sites.length > 0) {
      activeSite = data.sites[0];
      document.querySelector('.site-dropdown span').textContent = activeSite.name || activeSite.sshHost;
    }
  } catch (e) {
    addLog('err', 'Cannot connect to Synpress server — is it running?');
  }
}

// Save site config
async function saveSiteConfig(siteData) {
  const res = await fetch(`${API}/sites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(siteData)
  });
  return res.json();
}

// Stream SSE from backend
function streamAction(endpoint, body, onDone) {
  const url = `${API}${endpoint}`;
  addLog('cmd', `POST ${endpoint}`);

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(res => {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    function read() {
      reader.read().then(({ done, value }) => {
        if (done) { if (onDone) onDone(); return; }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            try {
              const { type, data } = JSON.parse(line.slice(6));
              addLog(type, data);
              if (type === 'success') { showToast(data, 'success'); hideProgress(); }
              if (type === 'fail') { showToast(data, 'error'); hideProgress(); }
            } catch {}
          }
        });
        read();
      });
    }
    read();
  }).catch(err => {
    addLog('err', 'Server error: ' + err.message);
    showToast('Server not reachable', 'error');
  });
}

// ── Actions using real API
function realPull() {
  if (!activeSite) return showToast('No site configured!', 'error');
  showProgress('Pulling database from live...');
  streamAction('/db/pull', activeSite);
}

function realPush() {
  if (!activeSite) return showToast('No site configured!', 'error');
  showProgress('Pushing database to live...');
  streamAction('/db/push', activeSite);
}

function realGitPull() {
  if (!activeSite) return showToast('No site configured!', 'error');
  showProgress('Git pull...');
  streamAction('/git/pull', { localPath: activeSite.localPath, branch: activeSite.branch || 'main' });
}

function realGitPush() {
  if (!activeSite) return showToast('No site configured!', 'error');
  const msg = prompt('Commit message:', 'Synpress deploy') || 'Synpress deploy';
  showProgress('Git push...');
  streamAction('/git/push', { localPath: activeSite.localPath, branch: activeSite.branch || 'main', message: msg });
}

function realTestSSH() {
  if (!activeSite) return showToast('No site configured!', 'error');
  showProgress('Testing SSH connection...');
  streamAction('/test-ssh', activeSite);
}

// On load
window.addEventListener('load', loadSites);
