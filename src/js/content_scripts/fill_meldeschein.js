console.log("fill_meldeschein loaded");

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        console.log(request.data);
        for (const [key, value] of Object.entries(request.data)) {
            document.getElementById(key).value = value;
        }
    });
