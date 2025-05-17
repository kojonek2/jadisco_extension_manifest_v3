chrome.runtime.onMessage.addListener(msg => {
    if ('volume' in msg) {
		document.getElementById('player').volume = msg.volume;
		document.getElementById('player').play();
	}
});
