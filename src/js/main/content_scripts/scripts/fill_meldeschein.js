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

            if(typeof value === "object"){

                const htmlElement = document.getElementById(key);
                htmlElement.value = value.value;

                const changeEvent = document.createEvent("HTMLEvents");
                changeEvent.initEvent(value.event, false, true);
                htmlElement.dispatchEvent(changeEvent);

            } else {

                document.getElementById(key).value = value;

            }

        }
    });
