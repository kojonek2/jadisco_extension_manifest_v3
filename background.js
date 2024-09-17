var websocket;
var websocketHeartbeatInterval;
var reconnectInterval;
var streamStatus = false;

function makeWebsocket() {
	try {
		websocket = new WebSocket("wss://api.pancernik.info/notifier")
		makeListeners()
	} catch(err) {
		console.log("Error when creating websocket " + err)
	}
}

function closeWebsocket() {
	websocket.close()
}

function makeListeners() {
	websocket.onopen = function () {
		console.log("Connected!")
		//chrome.action.setBadgeBackgroundColor({ color: "#00FF00" })
		chrome.action.setBadgeBackgroundColor({ color: "#666666" })
		chrome.action.setBadgeText({ text: "+" })

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
			
			if (messageJson.data["stream"]) {
				if (messageJson.data.stream.status == true) {
					if (!streamStatus) {
						streamStatus = true
						showNotification("Strumień trwa.")
						playSound()
					}
				} else {
					streamStatus = false
				}
			}

			console.log(event.data)
		} else if (type == "update") {
			updateBall(messageJson)
			
			if (messageJson.data["topic"]) {
				showNotification("Nowy temat: " + messageJson.data.topic.text)
			}
			if (messageJson.data["stream"]) {
				if (messageJson.data.stream.status == true) {
					streamStatus = true
					showNotification("Strumień właśnie się zaczął!")
					playSound()
				} else {
					streamStatus = false
				}
			}
			
			console.log(event.data)
		} else {
			console.log(event.data)
		}
	}
	
	websocket.onclose = function () {
		console.log("Disconnected!")
		//chrome.action.setBadgeBackgroundColor({ color: "#FF0000" })
		chrome.action.setBadgeText({ text: "-" })
		
		stopHeartbeat()
		
		clearInterval(reconnectInterval)
		reconnectInterval = setInterval(function () {
			console.log("Attempt to reconnect")
			makeWebsocket()
		}, 20000)
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

chrome.action.onClicked.addListener(function () {
/*	if (websocket == null || websocket.readyState == WebSocket.CLOSED) {
		makeWebsocket()
		doReconnect = true;
	} else if (websocket != null && websocket.readyState == WebSocket.OPEN) {
		doReconnect = false;
		closeWebsocket()
	}*/
	
	showNotification("Testowe powiadomienie!")
	playSound()
})

chrome.notifications.onClicked.addListener(function(notificationId) {
	chrome.tabs.create({url: 'https://jadisco.pl'});
});

chrome.runtime.onStartup.addListener(function() {
	showNotification("2")

	console.log("runtime.onStartup")
	reconnectInterval = setInterval(function () {
		console.log("Attempt to connect")
		makeWebsocket()
	}, 20000)
});
/*
chrome.tabs.onActivated.addListener(function() {
	showNotification("3")

	console.log("tabs.onActivated")
	reconnectInterval = setInterval(function () {
		console.log("Attempt to connect")
		makeWebsocket()
	}, 20000)
});

chrome.windows.onCreated.addListener(function() {
	showNotification("2")

	console.log("windows.onCreated")
	reconnectInterval = setInterval(function () {
		console.log("Attempt to connect")
		makeWebsocket()
	}, 20000)
});



// start attempting to connect
showNotification("1")
reconnectInterval = setInterval(function () {
	console.log("Attempt to connect")
	makeWebsocket()
}, 20000)
*/