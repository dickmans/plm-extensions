
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'fetchData' && request.url) {
		fetch(request.url)
			.then(response => response.json())
			.then(data => sendResponse({ success: true, data: data }))
			.catch(error => sendResponse({ success: false, error: error.message }));
		return true;
	}
});