const saveOptions = () => {
    const MUTED = document.getElementById('muted').checked;
    const VOLUME = document.getElementById('volume').value;

    chrome.storage.sync.set(
        { muted: MUTED, volume: VOLUME },
        () => {
            const statusEl = document.getElementById('save');
            statusEl.textContent = '🔥 Options saved 🔥';
            setTimeout(() => {
                statusEl.textContent = '💾 Save';
            }, 1000);
        },
    );
};

const restoreOptions = () => {
    chrome.storage.sync.get(
        { muted: false, volume: 0.5 },
        (items) => {
            document.getElementById('muted').checked = items.muted;
            document.getElementById('volume').value = items.volume;
        },
    );
};

function openJadisco() {
    chrome.tabs.create({ url: 'https://jadisco.pl' });
}

let websocket;
let websocketHeartbeatInterval;
let connectInterval;
let streamStatus = false;
const TODAY = new Date();
const TODAY_ONLY = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());


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

function makeListeners() {
    websocket.onopen = function() {
        console.log('Connected!');

        websocket.send('{"type":"follow","site_id":16}');

        startHeartbeat();

        clearInterval(connectInterval);
    };

    websocket.onmessage = function(event) {
        let messageJson = JSON.parse(event.data);
        console.log('messageJson', messageJson);
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
                    if (statusDateOnly.getTime() === TODAY_ONLY.getTime()) {
                        statusTimeEl.innerText = statusDate.toLocaleTimeString(['pl-PL'], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                        });
                    } else {
                        statusTimeEl.innerText = statusDate.toLocaleDateString(['pl-PL'], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                        });
                    }
                }
            } else {
                statusEl.innerHTML = 'Offline';
                statusEl.classList = ['glow-red'];
                streamStatus = false;
                const statusDate = new Date(messageJson.data.host.created_at);
                const statusDateOnly = new Date(statusDate.getFullYear(), statusDate.getMonth(), statusDate.getDate());
                if (statusDateOnly.getTime() === TODAY_ONLY.getTime()) {
                    statusTimeEl.innerText = statusDate.toLocaleTimeString(['pl-PL'], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    });
                } else {
                    statusTimeEl.innerText = statusDate.toLocaleDateString(['pl-PL'], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    });
                }
            }


            try {
                let topicTimeEl = document.getElementById('topicTime');
                topicTimeEl.innerText = '';

                const inputDate = new Date(messageJson.data.topic.updated_at);

                const inputDateOnly = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

                if (inputDateOnly.getTime() === TODAY_ONLY.getTime()) {
                    topicTimeEl.innerText = inputDate.toLocaleTimeString(['pl-PL'], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    });
                } else {
                    topicTimeEl.innerText = inputDate.toLocaleDateString(['pl-PL'], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    });
                }

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


window.onblur = function() {
    closeWebsocket();
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('logo').addEventListener('click', openJadisco);
