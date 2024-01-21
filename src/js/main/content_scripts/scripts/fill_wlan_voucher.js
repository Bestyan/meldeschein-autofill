console.log("fill_wlan_voucher loaded");

const HOTSPOT_TEXT = "Hotspot:";

const TEXT_TO_FORM_INPUT_NAME = {
    "Gutschein-Definition:": "gueltigkeit",
    "Anzahl:": "anzahl",
    "Drucken:": "drucken",
    "Kommentar:": "kommentar"
};

const HOTSPOT_TO_VALUE = {
    "02-14-21 Fruehling": "REF_HotPor02Primel",
    "12 Enzian": "REF_HotPor12Enzian",
    "22 Lavendel": "REF_HotPor22Lavendel",
    "23 Rosen": "REF_HotPor23Rosen",
    "24 Tulpen": "REF_HotPor24Tulpen",
    "31 Nelken": "REF_HotPor31Nelken",
    "32 Narzissen": "REF_HotPor32Narzisse"
};

const GUELTIGKEIT_TO_VALUE = {
    "7 Tage": "REF_HotVou7Tage",
    "10 Tage": "REF_HotVou10Tage",
    "14 Tage": "REF_HotVou14Tage",
    "16 Tage": "REF_HotVou16Tage",
    "22 Tage": "REF_HotVou22Tage",
    "40 Tage": "REF_HotVou40Tage"
};

/*
    the wlan voucher site works like this:
    you select the hotspot (and trigger the change event)
    the entire lower half of the site reloads (resetting all the input fields)
    now you may set your input fields
*/
chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        console.log(request.data);

        const tdTags = document.getElementsByTagName("td");

        // find input fields / selects, skip if no textNode as first child
        [...tdTags].filter(td =>
            td.hasChildNodes() &&
            !td.innerHTML.includes("<td") &&
            td.innerHTML.includes(HOTSPOT_TEXT))
            .forEach(
                td => {
                    if(td.nextSibling == null){
                        console.log(td)
                    }
                    const hotspot = td.nextSibling.childNodes[0];

                    // set value and trigger change event
                    hotspot.value = HOTSPOT_TO_VALUE[request.data.hotspot];
                    const changeEvent_hotspot = new Event("change", { bubbles: false, cancelable: true })
                    hotspot.dispatchEvent(changeEvent_hotspot);
                }
            );

        // wait 1s for the site's ajax reload
        new Promise(resolve => setTimeout(resolve, 1000)).then(
            () => {
                const siteFormInputs = {};
                const textToFormInputName = JSON.parse(JSON.stringify(TEXT_TO_FORM_INPUT_NAME)); // copy the object
                const tdTagsAfterReload = document.getElementsByTagName("td");

                // find the relevant input nodes by searching for their label text
                [...tdTagsAfterReload].filter(td => td.hasChildNodes() && !td.innerHTML.includes("<td")).forEach(
                    td => {
                        for (const [labelText, data_field] of Object.entries(textToFormInputName)) {

                            if (!td.innerHTML.includes(labelText)) {
                                continue;
                            }

                            const input_field = td.nextSibling.childNodes[0];
                            siteFormInputs[data_field] = input_field;
                            delete textToFormInputName[labelText];
                            break;
                        }
                    }
                );

                // set values
                siteFormInputs.gueltigkeit.value = GUELTIGKEIT_TO_VALUE[request.data.gueltigkeit]
                siteFormInputs.anzahl.value = 2;
                siteFormInputs.drucken.checked = true;
                siteFormInputs.kommentar.value = request.data.kommentar;
            }
        )

    }
);