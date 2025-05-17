var websocket;
var websocketHeartbeatInterval;
var connectInterval;
var streamStatus = false;
var topic = "";

function makeWebsocket() {
	try {
		websocket = new WebSocket("wss://livegamers.pl/api/pubsub")
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
		//chrome.action.setBadgeBackgroundColor({ color: "#666666" })
		//chrome.action.setBadgeText({ text: "+" })
		updateBall(streamStatus)

		websocket.send("{\"type\":\"follow\",\"site_id\":16}")
		
		startHeartbeat()
		
		clearInterval(connectInterval)
	}
	
	websocket.onmessage = function (event) {
		let messageJson = JSON.parse(event.data)
		let type = messageJson.type
		
		if (type == "ping") {
			console.log("ping")
		} else if (type == "status") {
			let statusReceived = 0
			for (let i = 0; i < messageJson.data.services.length; i += 1) {
				//console.log(messageJson.data.services[i])
				if (messageJson.data.services[i].status.status == 1)
					statusReceived = 1
			}
			
			//let statusReceived = messageJson.data.services[2].status.status
			updateBall(statusReceived)
			//console.log(messageJson.data.services[2])
			//console.log(messageJson.data.services[2].status.status)
			
			if (statusReceived == 1) {
				if (!streamStatus) {
					streamStatus = true
					showNotification(topic == "" ? "Strumień trwa." : "Strumień właśnie się zaczął!")
					playSound()
				}
			} else {
				streamStatus = false
			}
			
			try {
			let topicReceived = messageJson.data.topic.text
				if (topic == "") {
					// first topic received
					topic = topicReceived
				} else {
					if (topic != topicReceived) {
						showNotification("Nowy temat: " + topicReceived)
						topic = topicReceived
					}
				}
			} catch(e) {
				console.log(e.message)
				console.log(messageJson)
			}

			console.log(event.data)
		} else {
			console.log(event.data)
		}
	}
	
	websocket.onclose = function () {
		console.log("Disconnected!")
		//chrome.action.setBadgeBackgroundColor({ color: "#FF0000" })
		//chrome.action.setBadgeText({ text: "-" })
		chrome.action.setIcon({path: {'16': '/icons/16-disconnected.png', '32': '/icons/32-disconnected.png'}})
		
		stopHeartbeat()
		
		startConnect()
	}
}

function startHeartbeat() {
	stopHeartbeat()
	websocketHeartbeatInterval = setInterval(function () {
		//console.log("pong")
		if (websocket.readyState == websocket.OPEN) {
			websocket.send("{\"type\": \"pong\"}")
		}
	}, 20000)
}

function stopHeartbeat() {
	clearInterval(websocketHeartbeatInterval)
}

function startConnect() {
	clearInterval(connectInterval)
	connectInterval = setInterval(function () {
		console.log("Attempt to connect")
		makeWebsocket()
	}, 20000)
}

function showNotification(mainMessage) {
	chrome.storage.sync.get({removeNotification: true }, (options) => {
		chrome.notifications.create('status', {
			type: 'basic',
			iconUrl: '/icons/128.png',
			title: 'Jadisco.pl',
			requireInteraction: options.removeNotification,
			priority: 2,
			silent: true,
			message: mainMessage
		}, function (callback_id) {
			if (options.removeNotification)
			{
				setTimeout(function() {
					chrome.notifications.clear(callback_id)
				}, 15000);
			}
		});
	})
}

function updateBall(statusReceived) {
	if (statusReceived == 1) {
		chrome.action.setIcon({path: {'16': '/icons/16-online.png', '32': '/icons/32-online.png'}})
	} else {
		chrome.action.setIcon({path: {'16': '/icons/16.png', '32': '/icons/32.png'}})
	}
}

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
					chrome.offscreen.closeDocument()
				}, 5000)
			}
		}
	);
}

chrome.notifications.onClicked.addListener(function(notificationId) {
	chrome.tabs.create({url: 'https://jadisco.pl'});
});

chrome.runtime.onStartup.addListener(function() {
	console.log("runtime.onStartup")
	startConnect()
});

startConnect();