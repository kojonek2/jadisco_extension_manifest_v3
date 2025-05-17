const mutedEl = document.getElementById('muted');
const volumeEl = document.getElementById('volume');
const saveEl = document.getElementById('save');

let websocket;
let websocketHeartbeatInterval;
let connectInterval;
let streamStatus = false;
const TODAY = new Date();
const TODAY_ONLY = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());

const saveOptions = () => {
    const MUTED = mutedEl.checked;
    const VOLUME = volumeEl.value;

    chrome.storage.sync.set(
        { muted: MUTED, volume: VOLUME },
        () => {
            saveEl.textContent = '🔥 Options saved 🔥';
            setTimeout(() => {
                saveEl.textContent = '💾 Save';
            }, 1000);
        },
    );
};

const restoreOptions = () => {
    chrome.storage.sync.get(
        { muted: false, volume: 0.5 },
        (items) => {
            mutedEl.checked = items.muted;
            volumeEl.value = items.volume;
        },
    );
};

function openJadisco() {
    chrome.tabs.create({ url: 'https://jadisco.pl' });
}

function makeWebsocket() {
    try {
        websocket = new WebSocket('wss://livegamers.pl/api/pubsub');
        makeListeners();
    } catch (err) {
        console.log('Error when creating websocket ' + err);
    }
}

function closeWebsocket() {
    websocket.close();
}

function assingDateToElement(dateOnly, element, fullDate) {
    if (dateOnly.getTime() === TODAY_ONLY.getTime()) {
        element.innerText = fullDate.toLocaleTimeString(['pl-PL'], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    } else {
        element.innerText = fullDate.toLocaleDateString(['pl-PL'], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    }
}

function makeListeners() {
    websocket.onopen = function() {
        console.log('Connected!');
        websocket.send('{"type":"follow","site_id":16}');
        startHeartbeat();
        clearInterval(connectInterval);
    };

    websocket.onmessage = function(event) {
        let messageJson = JSON.parse(event.data);
        let type = messageJson.type;
        if (type === 'ping') {
            console.log('ping');
        } else if (type === 'status') {
            let statusReceived = messageJson.data.services.some(service => service.status.status === 1);
            let statusEl = document.getElementById('status');
            let statusTimeEl = document.getElementById('statusTime');

            if (statusReceived) {
                if (!streamStatus) {
                    statusEl.innerHTML = 'On air';
                    statusEl.classList = ['glow-green'];
                    streamStatus = true;
                    playSound();

                    const youngest = messageJson.data.services.reduce((latest, current) => {
                        return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
                    });
                    const statusDate = new Date(youngest.created_at);
                    const statusDateOnly = new Date(statusDate.getFullYear(), statusDate.getMonth(), statusDate.getDate());
                    assingDateToElement(statusDateOnly, statusTimeEl, statusDate);
                }
            } else {
                statusEl.innerHTML = 'Offline';
                statusEl.classList = ['glow-red'];
                streamStatus = false;

                const statusDate = new Date(messageJson.data.host.created_at);
                const statusDateOnly = new Date(statusDate.getFullYear(), statusDate.getMonth(), statusDate.getDate());
                assingDateToElement(statusDateOnly, statusTimeEl, statusDate);
            }


            try {
                let topicTimeEl = document.getElementById('topicTime');
                topicTimeEl.innerText = '';

                const inputDate = new Date(messageJson.data.topic.updated_at);
                const inputDateOnly = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
                assingDateToElement(inputDateOnly, topicTimeEl, inputDate);

                let topicEl = document.getElementById('topic');
                topicEl.innerText = '';
                topicEl.innerText = messageJson.data.topic.text;
            } catch (e) {
                console.log(e.message);
                console.log(messageJson);
            }
        }
    };

    websocket.onclose = function() {
        console.log('Disconnected!');
        chrome.action.setIcon({ path: { '16': '/icons/16-disconnected.png', '32': '/icons/32-disconnected.png' } });
        stopHeartbeat();
        startConnect();
    };
}

function startHeartbeat() {
    stopHeartbeat();
    websocketHeartbeatInterval = setInterval(function() {
        if (websocket.readyState === websocket.OPEN) {
            websocket.send('{"type": "pong"}');
        }
    }, 20000);
}

function stopHeartbeat() {
    clearInterval(websocketHeartbeatInterval);
}

function startConnect() {
    makeWebsocket();
    clearInterval(connectInterval);
    connectInterval = setInterval(function() {
        console.log('Attempt to connect');
        makeWebsocket();
    }, 5000);
}

startConnect();


function playSound() {
    chrome.storage.sync.get(
        { muted: false, volume: 0.5 },
        async (items) => {
            if (!items.muted) {
                await chrome.offscreen.createDocument({
                    url: chrome.runtime.getURL('audio.html'),
                    reasons: ['AUDIO_PLAYBACK'],
                    justification: 'notification',
                });
                await chrome.runtime.sendMessage({ volume: items.volume });

                setTimeout(function() {
                    chrome.offscreen.closeDocument();
                }, 5000);
            }
        },
    );
}

const toggleOptions = () => {
    console.log('Toggle options');
    const settingsEl = document.getElementById('settings');
    if (settingsEl.hasAttribute('hidden')) {
        settingsEl.removeAttribute('hidden');
        document.getElementById('settingsButton').innerText = '💀';
    } else {
        settingsEl.setAttribute('hidden', null);
        document.getElementById('settingsButton').innerText = '📎';
    }
};


window.onblur = function() {
    closeWebsocket();
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('logo').addEventListener('click', openJadisco);
document.getElementById('settingsButton').addEventListener('click', toggleOptions);
saveEl.addEventListener('click', saveOptions);
