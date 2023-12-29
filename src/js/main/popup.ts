// for webpack (css needs to be referenced to be packed)
import "../../css/popup.css";

import XLSX from 'xlsx';
import { Tabulator } from 'tabulator-tables';
import mailGenerator from './review_email/mail_generator';
import database from './database/database';
import dataUtil from './util/data_utils';
import uiUtil from './util/ui_utils';
import constants from './util/constants';
import dataUtils from "./util/data_utils";
import checkinGenerator from './checkin_document/checkin_generator';
import contentScriptConnector from './content_scripts/connector';

// dropdowns in popup
const COLUMNS_FILTER_REISE = ["Anreise", "Abreise", "Nachname", "Email"];

/**
 * reads xls to json
 * @param {Event} event
 */
function handleFile(event: Event) {
    uiUtil.showLoadingOverlay();
    const file = (event.target as HTMLInputElement).files[0];
    const reader = new FileReader();
    reader.onload = event => {
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true
        });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // hand over to database
        const sheet_as_json = XLSX.utils.sheet_to_json(sheet);
        console.log(sheet_as_json);

        // TODO
        //database.initBookings(sheet_as_json);
        uiUtil.hideLoadingOverlay();
    };
    reader.readAsArrayBuffer(file);
}

function refreshStatus() {
    const NO_DATA = "keine Daten";
    const status = document.getElementById("status");
    status.classList.remove("good", "bad");

    if (database.hasData()) {

        status.classList.add("good");
        status.innerHTML = `Daten vom ${database.xls_upload_datetime}`;

    } else {

        status.classList.add("bad");
        status.innerHTML = NO_DATA;
        return;

    }
}

/**
 * populate the popup.html <select> tags with <option> tags
 */
function setupSearchDropDowns() {

    // anreise / abreise
    COLUMNS_FILTER_REISE.forEach(column => {
        let option = document.createElement("option");
        option.value = column;
        option.innerHTML = column;
        document.getElementById("search1").append(option);
    });

    // preset the anreise/abreise search field to today
    uiUtil.getHtmlInputElement("search1_input").value = new Date().toISOString().substring(0, "yyyy-mm-dd".length);

    // +1 day on the anreise/abreise search field
    document.getElementById("date_plus_one").addEventListener("click", event => {
        uiUtil.getHtmlInputElement("search1_input").stepUp(1);
    });
    // -1 day on the anreise/abreise search field
    document.getElementById("date_minus_one").addEventListener("click", event => {
        uiUtil.getHtmlInputElement("search1_input").stepUp(-1);
    });
}

function searchDB(event: Event) {

    event.preventDefault();

    let search1 = uiUtil.getHtmlInputElement("search1_input").value;
    // TODO search
    let rows = database.search("TODO", "TODO");

    result_table = new Tabulator("#search_results", {
        layout: "fitDataFill",
        data: rows,
        selectableRollingSelection: true,
        selectable: 1,
        pagination: true,
        paginationSize: 10,
        columns: [{
            title: "Vorname",
            field: "organiser_firstname"
        },
        {
            title: "Nachname",
            field: "organiser_lastname"
        },
        {
            title: "Anreise",
            field: "arrival"
        },
        {
            title: "Abreise",
            field: "departure"
        },
        {
            title: "Apartment",
            field: "apartment"
        },
        {
            title: "Email",
            field: "email"
        }
        ]
    });
}

function generateMail() {
    let data = getSelectedTableRow();
    if (data == null) {
        alert("keine Tabellenzeile ausgewählt");
        return;
    }

    data.anrede = uiUtil.getHtmlSelectElement('anrede').value;
    const pronomen = uiUtil.getHtmlSelectElement('pronomen').value;
    const isFirstVisit = uiUtil.getHtmlSelectElement('is_first_visit').value == 'true';

    mailGenerator.generate(data, pronomen as "Du" | "Sie", isFirstVisit);
}

/**
 * send a single request to wake the server from its sleep
 */
function wakeServer() {
    fetch(constants.getServerURL() + constants.SERVER_WAKE_UP)
        .then(response => response.json())
        .then(json => {
            // set server status here
            console.log(json);
        })
        .catch(error => {
            // set server status here
            console.log(error);
        });
}

function getSelectedTableRow() {
    if (result_table == null) {
        return null;
    }

    return result_table.getSelectedData()[0];
}

function fillMeldeschein() {
    const data = getSelectedTableRow();
    if (!data) {
        alert("keine Tabellenzeile ausgewählt");
        return;
    }

    let form_data = {
        anreise_input: data.anreise,
        abreise_input: data.abreise,
        nachname0: data.nachname, //Nachname Gast
        vorname0: data.vorname,
        strasse0: data.strasse || data.anschrift,
        plz0_input: data.plz,
        ort0_input: data.ort,
        email: data.email.includes("bitte_email_eintragen@tomas.travel") ? "" : data.email
    };

    if (data.land !== "") { // TODO
        //form_data.land0_input = data.land; // Land in Adresse (vorausgefüllt Deutschland)
        //form_data.staat0_input = data.land; // Staatsangehörigkeit Gast
        //form_data.staat1_input = data.land; // Staatsangehörigkeit Begl. 1
    }

    // send available data now, firstname data will be sent in a second message
    contentScriptConnector.send(form_data);

    const vorname = data.vorname.split(" ")[0];
    database.getGender(vorname)
        .then(
            // onFulfilled
            (gender: "M" | "F" | undefined) => {

                if (gender === "M" || gender === "F") { // firstname has an entry in the firstname table
                    const anrede = constants.getAnrede(gender);

                    // send data to content script fill_meldeschein.js
                    contentScriptConnector.send({
                        anrede0: anrede,
                        // Anrede der Begleitperson != Anrede des Buchenden
                        anrede1: anrede === constants.ANREDE_HERR ? constants.ANREDE_FRAU : constants.ANREDE_HERR
                    });

                } else { // firstname does not have an entry in the firstname table => query the user for its gender
                    const genderPopup = document.getElementById("firstname_gender");
                    genderPopup.classList.remove("hide");
                    document.getElementById("firstname").textContent = `"${vorname}"`;

                    document.getElementById("firstname_male").addEventListener("click", function handler(event) {
                        genderPopup.classList.add("hide");
                        // add firstname entry to db
                        database.addFirstName(vorname, "M");

                        // send firstname dependent data
                        contentScriptConnector.send({
                            anrede0: constants.ANREDE_HERR,
                            anrede1: constants.ANREDE_FRAU,
                        });

                        // remove event listener
                        event.target.removeEventListener(event.type, handler);
                    });

                    document.getElementById("firstname_female").addEventListener("click", function handler(event) {
                        genderPopup.classList.add("hide");
                        // add firstname entry to db
                        database.addFirstName(vorname, "F");

                        // send firstname dependent data
                        contentScriptConnector.send({
                            anrede0: constants.ANREDE_FRAU,
                            anrede1: constants.ANREDE_HERR,
                        });

                        // remove event listener
                        event.target.removeEventListener(event.type, handler);
                    });

                    document.getElementById("firstname_unknown").addEventListener("click", function handler(event) {
                        genderPopup.classList.add("hide");
                        // send firstname dependent data
                        contentScriptConnector.send({
                            anrede0: constants.ANREDE_GAST,
                            anrede1: constants.ANREDE_GAST,
                        });

                        // remove event listener
                        event.target.removeEventListener(event.type, handler);
                    });
                }
            }
        )
        .catch(error => console.log(error));
}


function buildUI() {
    refreshStatus();

    // Button minimieren
    document.getElementById('minimize').addEventListener('click', event => {
        uiUtil.hideContent();

        const minimize = document.getElementById('minimize');
        minimize.classList.remove("hide");
        minimize.classList.add("hide");

        document.getElementById('maximize').classList.remove("hide");
    });

    // Button maximieren
    document.getElementById('maximize').addEventListener('click', event => {
        uiUtil.showContent();
        const maximize = document.getElementById('maximize');
        maximize.classList.remove("hide");
        maximize.classList.add("hide");

        document.getElementById('minimize').classList.remove("hide");
    });

    // Button Einstellungen (Zahnrad)
    document.getElementById('settings').addEventListener('click', event => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    });

    // Button "Daten löschen"
    document.getElementById('delete').addEventListener('click', event => {
        database.resetBookingsTable();
        alert("Daten gelöscht");
        refreshStatus();
    });

    // Button "Choose file"
    document.getElementById('upload').addEventListener('change', handleFile, false);

    // Suchparameter (Dropdowns)
    setupSearchDropDowns();

    // Button/Form "suchen"
    document.getElementById('search').addEventListener('submit', searchDB);

    // Button "Meldeschein ausfüllen"
    document.getElementById('meldeschein_fill').addEventListener("click", event => fillMeldeschein());

    // Button "WLAN Voucher ausfüllen"
    document.getElementById('wlan_voucher_fill').addEventListener('click', event => {
        const data = getSelectedTableRow();
        if (data == null) {
            alert("keine Tabellenzeile ausgewählt");
            return;
        }

        // message to content script fill_vlan_voucher.js
        contentScriptConnector.send({
            hotspot: dataUtil.getHotspot(data.apartment),
            gueltigkeit: dataUtil.getVoucherGueltigkeit(data.abreise),
            kommentar: dataUtil.getKommentar(data)
        });
    });

    // Button "Check-in Dokument"
    document.getElementById('checkin_download').addEventListener('click', event => {
        const tableData = getSelectedTableRow();
        // create placeholder mappings from selected table row. if no row is selected, blank lines will be generated instead
        let placeholderData: any = null;
        if (tableData != null) {
            placeholderData = {
                apartment: tableData.apartment,
                aufenthaltszeit: `${tableData.anreise} ‒ ${tableData.abreise}`,
                anreise: tableData.anreise,
            };

            // name placeholders are name1, name2, name3 etc
            // if no names have been found, only the name of the person who booked will appear as name1
            // const guests = database.getGuests(tableData);
            if(false) { // TODO

            } else {
                placeholderData.name1 = `${tableData.vorname} ${tableData.nachname}`;
            }

            // placeholders schluessel and anzahlSchluessel
            // TODO
            // let numberOfKeys = dataUtils.getNumberOfKeys(birthdates, tableData.anreise);
            // if (numberOfKeys > 0) {
            //     const keys = database.getKeys(tableData.apartment, numberOfKeys).join(", ");
            //     placeholderData.anzahlSchluessel = numberOfKeys;
            //     placeholderData.schluessel = keys;
            // }
        }

        checkinGenerator.generate(placeholderData)
            .then(() => console.log("checkin docx generated"))
            .catch(error => alert(error));
    })

    // Dropdown "Sie"/"Du"
    document.getElementById('pronomen').addEventListener('change', event => {
        const pronomen = uiUtil.getHtmlSelectElement('pronomen');
        const anrede = uiUtil.getHtmlSelectElement('anrede');
        const firstVisit = uiUtil.getHtmlSelectElement('is_first_visit');

        if (pronomen.value === "Sie") {

            anrede.removeAttribute("disabled");
            firstVisit.removeAttribute("disabled");

        } else if (pronomen.value === "Du") {

            anrede.setAttribute("disabled", "disabled");
            firstVisit.setAttribute("disabled", "disabled");

        }
    })

    // Button [Mail] "erstellen"
    document.getElementById('generate').addEventListener('click', generateMail, false);

    // Visibility of Buttons
    chrome.tabs.query({
        currentWindow: true,
        active: true
    },
        tabs => {
            let url = tabs[0].url;

            const meldeschein_fill_button = document.getElementById('meldeschein_fill');
            const wlan_voucher_fill_button = document.getElementById('wlan_voucher_fill');

            meldeschein_fill_button.classList.remove('hide');
            wlan_voucher_fill_button.classList.remove('hide');

            // no url entered
            if (url == null || url == undefined) {
                url = "";
            }

            if (!url.toString().includes('emeldeschein.de')) {
                meldeschein_fill_button.classList.add('hide');
            }

            if (!url.toString().includes('192.168.1.254:44444') &&
                !url.toString().includes('file://')) {
                wlan_voucher_fill_button.classList.add('hide');
            }
        });
}

wakeServer();
console.log(`environment: ${process.env.NODE_ENV}`);

// Tabulator table
let result_table: any = null;

database.setup(refreshStatus);

buildUI();