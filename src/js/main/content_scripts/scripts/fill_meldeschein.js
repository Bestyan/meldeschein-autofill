console.log("fill_meldeschein loaded");

/**
 * request data is expected to look like this:
 *  {
 *      field1 : value1,
 *      field2 : value2,
 *      field3 : {
 *          value: value3,
 *          event: "change"|"blur"
 *      }
 *  }
 */
chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        console.log(request.data);
        for (const [key, value] of Object.entries(request.data)) {
            
            const htmlElement = document.getElementById(key);
            if(htmlElement == null) {
                console.log(`no htmlElement with id="${key}" found`)
                continue;
            }

            if(typeof value === "object"){

                htmlElement.value = value.value;

                const changeEvent = document.createEvent("HTMLEvents");
                changeEvent.initEvent(value.event, false, true);
                htmlElement.dispatchEvent(changeEvent);

            } else {

                htmlElement.value = value;

            }

        }
    });
