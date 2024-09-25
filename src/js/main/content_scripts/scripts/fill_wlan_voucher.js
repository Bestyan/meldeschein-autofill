console.log("fill_wlan_voucher loaded");

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

        if (!isValidRequestData(request.data)) {
            alert("Alle Label Texte müssen in den Plugin Einstellungen konfiguriert sein! Felder werden nicht ausgefüllt.");
            return;
        }

        const tdTags = document.getElementsByTagName("td");

        // find input fields / selects, skip if no textNode as first child
        [...tdTags].filter(td =>
            td.hasChildNodes() &&
            !td.innerHTML.includes("<td") &&
            td.innerHTML.includes(request.data.hotspotLabel))
            .forEach(
                td => {
                    if (td.nextSibling == null) {
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
                const siteFormInputs = {
                    duration: [],
                    amount: [],
                    print: [],
                    comment: []
                };
                const tdTagsAfterReload = document.getElementsByTagName("td");

                // find the relevant input nodes by searching for their label text
                [...tdTagsAfterReload]
                    .filter(td => td.hasChildNodes() && !td.innerHTML.includes("<td"))
                    .filter(td => td.nextSibling != null && td.nextSibling.hasChildNodes())
                    .filter(td => td.nextSibling.innerHTML.includes("<input") || td.nextSibling.innerHTML.includes("<select"))
                    .forEach(
                        td => {
                            const inputField = td.nextSibling.childNodes[0];
                            if(!isValidInputField(inputField)){
                                return;
                            }
                            if (td.innerHTML.includes(request.data.durationLabel)) {
                                console.log("found durationLabel");
                                siteFormInputs.duration.push(inputField);
                                return;
                            }
                            if (td.innerHTML.includes(request.data.amountLabel)) {
                                console.log("found amountLabel");
                                siteFormInputs.amount.push(inputField);
                                return;
                            }
                            if (td.innerHTML.includes(request.data.printLabel)) {
                                console.log("found printLabel");
                                siteFormInputs.print.push(inputField);
                                return;
                            }
                            if (td.innerHTML.includes(request.data.commentLabel)) {
                                console.log("found commentLabel");
                                siteFormInputs.comment.push(inputField);
                                return;
                            }
                        }
                    );

                // set values for all fields, some might throw errors but we ignore those
                [...siteFormInputs.duration].forEach(field => {
                    try {
                        field.value = GUELTIGKEIT_TO_VALUE[request.data.duration]
                    } catch {}
                });
                [...siteFormInputs.amount].forEach(field => {
                    try {
                        field.value = 2;
                    } catch {}
                });
                [...siteFormInputs.print].forEach(field => {
                    try {
                        field.checked = true;
                    } catch {}
                });
                [...siteFormInputs.comment].forEach(field => {
                    try {
                        field.value = request.data.comment;
                    } catch {}
                });
            }
        );
    }
);

function isValidRequestData(data) {
    if (data.durationLabel === "") {
        return false;
    }
    if (data.amountLabel === "") {
        return false;
    }
    if (data.printLabel === "") {
        return false;
    }
    if (data.commentLabel === "") {
        return false;
    }
    return true;
}

function isValidInputField(inputField){
    const isInput = inputField.nodeName === "INPUT";
    const isSelect = inputField.nodeName === "SELECT";
    const isTypeTextOrCheckbox = inputField.type === "text" || inputField.type === "checkbox";
    return isSelect || (isInput && isTypeTextOrCheckbox);
}
