export default {
  send: (data: Object) => {
    if (data === null) {
      return;
    }

    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, {
        data: data
      });
    });
  }
}