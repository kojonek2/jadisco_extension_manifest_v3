const saveOptions = () => {
  const muted = document.getElementById('muted').checked;
  const volume = document.getElementById('volume').value;

  chrome.storage.sync.set(
    { muted: muted, volume: volume },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 750);
    }
  );
};

const restoreOptions = () => {
  chrome.storage.sync.get(
    { muted: false, volume: 0.5 },
    (items) => {
      document.getElementById('muted').checked = items.muted;
      document.getElementById('volume').value = items.volume;
    }
  );
};

function openJadisco() {
  chrome.tabs.create({url: 'https://jadisco.pl'});
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('openJadisco').addEventListener('click', openJadisco);
