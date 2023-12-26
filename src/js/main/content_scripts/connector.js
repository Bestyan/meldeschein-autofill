export default {
  send: (data) => {
    if (data === null) {
      return;
    }

    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        data: data
      });
    });
  }
}