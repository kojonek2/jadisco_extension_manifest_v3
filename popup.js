const saveOptions = () => {
  const muted = document.getElementById('muted').checked;
  const volume = document.getElementById('volume').value;
  const removeNotification = document.getElementById('removeNotification').checked;

  chrome.storage.sync.set(
    { muted: muted, volume: volume, removeNotification: removeNotification },
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
    { muted: false, volume: 0.5, removeNotification: true },
    (items) => {
      document.getElementById('muted').checked = items.muted;
      document.getElementById('volume').value = items.volume;
      document.getElementById('removeNotification').checked = items.removeNotification;
    }
  );
};

function openJadisco() {
  chrome.tabs.create({url: 'https://jadisco.pl'});
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('openJadisco').addEventListener('click', openJadisco);
