const saveOptions = () => {
  const muted = document.getElementById('muted').checked;
  const volume = document.getElementById('volume').value;
  const removeNotification = document.getElementById('removeNotification').checked;
  const runInBackground = document.getElementById('runInBackground').checked;
  SetRunInBackground(runInBackground);

  chrome.storage.sync.set(
    { muted: muted, volume: volume, removeNotification: removeNotification, runInBackground: runInBackground },
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

function SetRunInBackground(runInBackground)
{
  chrome.permissions.contains({permissions: ["background"]}, (result) => {
    if (runInBackground == result)
    {
      document.getElementById('runInBackground').checked = runInBackground;
      chrome.storage.sync.set({runInBackground: runInBackground});
    }
    else
    {
      if (runInBackground)
      {
        chrome.permissions.request({permissions: ["background"]}, (result) => {
          document.getElementById('runInBackground').checked = result;
          chrome.storage.sync.set({runInBackground: result});
        })
      }
      else
      {
        chrome.permissions.remove({permissions: ["background"]}, (result) => {
          document.getElementById('runInBackground').checked = !result;
          chrome.storage.sync.set({runInBackground: !result});
        });
      }
    }
  })
}

const restoreOptions = () => {
  chrome.storage.sync.get(
    { muted: false, volume: 0.5, removeNotification: true, runInBackground: true },
    (items) => {
      document.getElementById('muted').checked = items.muted;
      document.getElementById('volume').value = items.volume;
      document.getElementById('removeNotification').checked = items.removeNotification;
      document.getElementById('runInBackground').checked = items.runInBackground;

      chrome.permissions.contains({permissions: ["background"]}, (result) => {
        if (items.runInBackground != result)
          alert("Uprawnienia do działania w tle, niesycnhronizowane z uprawnieniami przeglądarki. Zapisz ustawienia rozszerzenia (zmiana możliwa tylko przy akcji użytkownika)!")
      })
    }
  );
};

function openJadisco() {
  chrome.tabs.create({url: 'https://jadisco.pl'});
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('openJadisco').addEventListener('click', openJadisco);
