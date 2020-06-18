console.log("fill_wlan_voucher loaded");

const TEXT_TO_DATA_FIELD = {
    "Hotspot:": "hotspot",
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

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        const tdTags = document.getElementsByTagName("td");
        const data_fields = {};
        const text_to_data_field = JSON.parse(JSON.stringify(TEXT_TO_DATA_FIELD));

        // find input fields / selects
        [...tdTags].forEach(
            td => {

                // skip if no textNode as first child
                if (!td.hasChildNodes() || td.childNodes[0].nodeType !== Node.TEXT_NODE) {
                    return;
                }
                const textNode = td.childNodes[0];
                for (const [text, data_field] of Object.entries(text_to_data_field)) {

                    if (textNode.nodeValue.includes(text)) {
                        let input_field = td.nextSibling.childNodes[0];
                        data_fields[data_field] = input_field;
                        delete text_to_data_field[text];
                        break;
                    }
                }
            }
        );

        console.log(request.data);

        data_fields["anzahl"].value = 2;
        data_fields["drucken"].checked = true;
        data_fields["hotspot"].value = HOTSPOT_TO_VALUE[request.data.hotspot];
        data_fields["gueltigkeit"].value = GUELTIGKEIT_TO_VALUE[request.data.gueltigkeit];
        data_fields["kommentar"].value = request.data.kommentar;
    });