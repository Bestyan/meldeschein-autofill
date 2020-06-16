console.log("fill_wlan_voucher loaded");

const TEXT_TO_DATA_FIELD = {
    "Hotspot:": "hotspot",
    "Voucher-Definition:": "gueltigkeit",
    "Anzahl:": "anzahl",
    "Drucken:": "drucken"
};

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        const tdTags = document.getElementsByTagName("td");
        const data_fields = {};

        // find input fields / selects
        [...tdTags].forEach(
            td => {

                // skip if no textNode as first child
                if(!td.hasChildNodes() || td.childNodes[0].nodeType !== Node.TEXT_NODE){
                    return;
                }
                const textNode = td.childNodes[0];
                for(const [text, data_field] of Object.entries(TEXT_TO_DATA_FIELD)){

                    if(textNode.nodeValue.includes(text)){
                        let input_field = td.nextSibling.childNodes[0];
                        data_fields[data_field] = input_field;
                        delete TEXT_TO_DATA_FIELD[data_field];
                        break;
                    }
                }
            }
        );

        console.log(data_fields);
    });
