var websocket;
var websocketHeartbeatInterval;
var doReconnect = true;
var reconnectInterval;

function makeWebsocket() {
	websocket = new WebSocket("wss://api.pancernik.info/notifier")
	makeListeners()
}

function closeWebsocket() {
	websocket.close()
}

function makeListeners() {
	websocket.onopen = function () {
		console.log("Connected!")
		chrome.action.setBadgeBackgroundColor({ color: "#00FF00" })
		chrome.action.setBadgeText({ text: "ON" })

		startHeartbeat()
		
		clearInterval(reconnectInterval)
	}
	
	websocket.onmessage = function (event) {
		let messageJson = JSON.parse(event.data)
		let type = messageJson.type
		
		if (type == "ping") {
			console.log("ping")
		} else if (type == "status") {
			updateBall(messageJson)
			console.log(event.data)
		} else if (type == "update") {
			updateBall(messageJson)
			if (messageJson.data["topic"]) {
				showNotification("Nowy temat: " + messageJson.data.topic.text)
			}
			if (messageJson.data["stream"]) {
				if (messageJson.data.stream.status == true) {
					showNotification("Strumień właśnie się zaczął!")
				}
			}
			
			console.log(event.data)
		} else {
			console.log(event.data)
		}
	}
	
	websocket.onclose = function () {
		console.log("Disconnected!")
		chrome.action.setBadgeBackgroundColor({ color: "#FF0000" })
		chrome.action.setBadgeText({ text: "OFF" })
		
		stopHeartbeat()
		
		if (doReconnect) {
			clearInterval(reconnectInterval)
			reconnectInterval = setInterval(function () {
				console.log("Attempt to reconnect")
				makeWebsocket()
			}, 60000)
		}
	}
}

function startHeartbeat() {
	stopHeartbeat()
	websocketHeartbeatInterval = setInterval(function () {
		//console.log("pong")
		websocket.send("{\"type\": \"pong\"}")
	}, 20000)
}

function stopHeartbeat() {
	clearInterval(websocketHeartbeatInterval)
}

chrome.action.onClicked.addListener(function () {
/*	if (websocket == null || websocket.readyState == WebSocket.CLOSED) {
		makeWebsocket()
		doReconnect = true;
	} else if (websocket != null && websocket.readyState == WebSocket.OPEN) {
		doReconnect = false;
		closeWebsocket()
	}*/
	
	showNotification("Strumień właśnie się zaczął!")
	playSound()
})

function showNotification(mainMessage) {
	chrome.notifications.create('status',
	{
		type: 'basic',
		iconUrl: '/icons/128.png',
		title: 'Jadisco.pl (testy v3)',
		requireInteraction: true,
		priority: 2,
		silent: true,
		message: mainMessage
	},
	function (callback_id) {
		setTimeout(function() {
			chrome.notifications.clear(callback_id);
		}, 15000);
	});
}

function updateBall(messageJson) {
	if (messageJson.data["stream"]) {
		if (messageJson.data.stream.status == true) {
			chrome.action.setIcon({path: {'16': '/icons/16-online.png', '32': '/icons/32-online.png'}});
		} else {
			chrome.action.setIcon({path: {'16': '/icons/16.png', '32': '/icons/32.png'}});
		}
	}
}

function playSound() {
  chrome.offscreen.createDocument({
    url: chrome.runtime.getURL('audio.html'),
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'notification',
  });
}


// start websocket
makeWebsocket()

chrome.notifications.onClicked.addListener(function(notificationId) {
	chrome.tabs.create({url: 'https://jadisco.pl'});
});
