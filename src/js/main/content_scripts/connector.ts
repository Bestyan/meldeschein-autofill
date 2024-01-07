export default {

  send: (data: Object): Promise<void> => {

    return new Promise((resolve, reject) => {
      if (data === null) {
        reject();
      }
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {
          data: data
        });
        resolve();
      });
    });

  }

};