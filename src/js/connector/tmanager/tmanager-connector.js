export default {
  /**
   * triggers the tmanager content script to select the predefined items
   */
  fillTManager: () => {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        hello: 'go do your stuff' // message content doesn't matter at all here, just sending a message is important
      });
    });
  }
}