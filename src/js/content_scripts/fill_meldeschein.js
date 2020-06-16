console.log("fill_meldeschein loaded");

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        for (const [key, value] of Object.entries(request.data)) {
            document.getElementById(key).value = value;
        }
    });
