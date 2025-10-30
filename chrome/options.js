chrome.storage.sync.get('serverUrl', (data) => {
	if (data.serverUrl) {
		document.getElementById('serverUrl').value = data.serverUrl;
	}
});

document.getElementById('saveButton').addEventListener('click', () => {
	const url = document.getElementById('serverUrl').value;
	chrome.storage.sync.set({ serverUrl: url }, () => {
		window.close();
	});
});