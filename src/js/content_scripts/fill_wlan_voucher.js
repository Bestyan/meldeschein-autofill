console.log("fill_wlan_voucher loaded");

const HOTSPOT_TEXT = "Hotspot:";

const TEXT_TO_DATA_FIELD = {
    "Voucher-Definition:": "gueltigkeit",
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
    "22 Tage": "REF_HotVou22Tage"
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
        [...tdTags].filter(_ => _.hasChildNodes() &&
                _.childNodes[0].nodeType === Node.TEXT_NODE &&
                _.childNodes[0].nodeValue.includes(HOTSPOT_TEXT))
            .forEach(
                td => {
                    const hotspot = td.nextSibling.childNodes[0];

                    // set value and trigger change event
                    hotspot.value = HOTSPOT_TO_VALUE[request.data.hotspot];
                    const changeEvent_hotspot = document.createEvent("HTMLEvents");
                    changeEvent_hotspot.initEvent("change", false, true);
                    hotspot.dispatchEvent(changeEvent_hotspot);
                }
            );

        // wait 1s for the site's ajax reload
        new Promise(resolve => setTimeout(resolve, 1000)).then(
            () => {
                const data_fields = {};
                const text_to_data_field = JSON.parse(JSON.stringify(TEXT_TO_DATA_FIELD)); // copy the object
                const tdTags_after_reload = document.getElementsByTagName("td");

                [...tdTags_after_reload].filter(_ => _.hasChildNodes() && _.childNodes[0].nodeType === Node.TEXT_NODE).forEach(
                    td => {
                        const textNode = td.childNodes[0];
                        for (const [text, data_field] of Object.entries(text_to_data_field)) {

                            if (!textNode.nodeValue.includes(text)) {
                                continue;
                            }

                            const input_field = td.nextSibling.childNodes[0];
                            data_fields[data_field] = input_field;
                            delete text_to_data_field[text];
                            break;
                        }
                    }
                );

                // set values
                data_fields.gueltigkeit.value = GUELTIGKEIT_TO_VALUE[request.data.gueltigkeit]
                data_fields.anzahl.value = 2;
                data_fields.drucken.checked = true;
                data_fields.kommentar.value = request.data.kommentar;
            }
        )

    }
);