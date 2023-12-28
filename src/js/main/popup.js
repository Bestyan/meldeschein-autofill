// for webpack (css needs to be referenced to be packed)
import "../../css/popup.css";

import XLSX from 'xlsx';
import Tabulator from 'tabulator-tables';
import mailGenerator from './review_email/mail_generator';
import database from './database/database';
import util from './util/data_utils';
import constants from './util/constants';
import dataUtils from "./util/data_utils";
import checkinGenerator from './checkin_document/checkin_generator';
import contentScriptConnector from './content_scripts/connector';

// dropdowns in popup
const COLUMNS_FILTER_REISE = ["anreise", "abreise"];
const COLUMNS_FILTER = ["nachname", "strasse", "plz", "ort", "apartment", "personen", "vermerk", "email"];

/**
 * reads xls to json
 * @param {Event} e
 */
function handleFile(e) {
    setLoadingScreenVisible(true);
    let files = e.target.files,
        f = files[0];
    let reader = new FileReader();
    reader.onload = e => {
        let data = new Uint8Array(e.target.result);
        let workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true
        });

        /*
            modify column names to not contain forbidden characters
        */
        let sheet = workbook.Sheets[workbook.SheetNames[0]];
        util.cleanColumnNames(sheet);
        /*
            hand over to database
        */
        let sheet_as_json = XLSX.utils.sheet_to_json(sheet);
        database.initDB(sheet_as_json);
        setLoadingScreenVisible(false);
    };
    reader.readAsArrayBuffer(f);
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
    document.getElementById("search1_input").value = new Date().toISOString().substr(0, "yyyy-mm-dd".length);

    // +1 day on the anreise/abreise search field
    document.getElementById("date_plus_one").addEventListener("click", event => {
        document.getElementById("search1_input").stepUp(1);
    });
    // -1 day on the anreise/abreise search field
    document.getElementById("date_minus_one").addEventListener("click", event => {
        document.getElementById("search1_input").stepUp(-1);
    });

    // nachname / strasse / etc
    COLUMNS_FILTER.forEach(column => {
        let option = document.createElement("option");
        option.value = column;
        option.innerHTML = column;
        document.getElementById("search2").append(option);
    });
}


function searchDB(event) {

    event.preventDefault();
    let searchParams = {};

    let search1 = document.getElementById("search1_input").value;
    if (search1.length > 0) {
        searchParams[document.getElementById("search1").value] = new Date(search1).toLocaleDateString("de-DE", constants.SEARCH_RESULT_DATE_FORMAT);
    }

    let search2 = document.getElementById("search2_input").value;
    if (search2.length > 0) {
        searchParams[document.getElementById("search2").value] = search2;
    }

    // query DB
    let rows = database.search(searchParams);

    result_table = new Tabulator("#search_results", {
        layout: "fitDataFill",
        data: rows,
        selectableRollingSelection: true,
        selectable: 1,
        pagination: "local",
        paginationSize: 10,
        columns: [{
            title: "Vorname",
            field: "vorname"
        },
        {
            title: "Nachname",
            field: "nachname"
        },
        {
            title: "Anreise",
            field: "anreise"
        },
        {
            title: "Abreise",
            field: "abreise"
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

    data.anrede = document.getElementById('anrede').value;
    const pronomen = document.getElementById('pronomen').value;
    const isFirstVisit = document.getElementById('is_first_visit').value == 'true';

    mailGenerator.generate(data, pronomen, isFirstVisit);
}

// set visibility of the "loading..." layer that blocks interaction with any elements
function setLoadingScreenVisible(visible) {
    const loadingScreen = document.getElementById('loading_screen');
    loadingScreen.classList.remove('hide', 'flex');
    if (visible) {
        loadingScreen.classList.add('flex');
    } else {
        loadingScreen.classList.add('hide');
    }
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

    if (data.land !== "") {
        form_data.land0_input = data.land; // Land in Adresse (vorausgefüllt Deutschland)
        form_data.staat0_input = data.land; // Staatsangehörigkeit Gast
        form_data.staat1_input = data.land; // Staatsangehörigkeit Begl. 1
    }

    // send available data now, firstname data will be sent in a second message
    contentScriptConnector.send(form_data);

    const vorname = data.vorname.split(" ")[0];
    database.getGender(vorname)
        .then(
            // onFulfilled
            gender => {

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


function setContentVisibility(isVisible) {
    const div = document.getElementById("content_container");
    div.classList.remove("hide");

    if (!isVisible) {
        div.classList.add("hide");
    }
}

function buildUI() {
    refreshStatus();

    // Button minimieren
    document.getElementById('minimize').addEventListener('click', event => {
        setContentVisibility(false);

        const minimize = document.getElementById('minimize');
        minimize.classList.remove("hide");
        minimize.classList.add("hide");

        document.getElementById('maximize').classList.remove("hide");
    });

    // Button maximieren
    document.getElementById('maximize').addEventListener('click', event => {
        setContentVisibility(true);
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
        database.resetBookingsTables();
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
            hotspot: util.getHotspot(data.apartment),
            gueltigkeit: util.getVoucherGueltigkeit(data.abreise),
            kommentar: util.getKommentar(data)
        });
    });

    // Button "Check-in Dokument"
    document.getElementById('checkin_download').addEventListener('click', event => {
        const tableData = getSelectedTableRow();
        // create placeholder mappings from selected table row. if no row is selected, blank lines will be generated instead
        let placeholderData = null;
        if (tableData != null) {
            placeholderData = {
                apartment: tableData.apartment,
                aufenthaltszeit: `${tableData.anreise} ‒ ${tableData.abreise}`,
                anreise: tableData.anreise,
            };

            // name placeholders are name1, name2, name3 etc
            // if no names have been found, only the name of the person who booked will appear as name1
            const namesAndBirthdates = database.getBirthdates(tableData);
            // TODO remove
            console.log(JSON.stringify(namesAndBirthdates));
            if (namesAndBirthdates && namesAndBirthdates.length > 0) {
                namesAndBirthdates.forEach((element, i) => {
                    placeholderData[`name${i + 1}`] = element.name;
                })
            } else {
                placeholderData.name1 = `${tableData.vorname} ${tableData.nachname}`;
            }

            // placeholders schluessel and anzahlSchluessel
            let numberOfKeys = dataUtils.getNumberOfKeys(namesAndBirthdates, tableData.anreise);
            if (numberOfKeys > 0) {
                const keys = database.getKeys(tableData.apartment, numberOfKeys).join(", ");
                placeholderData.anzahlSchluessel = numberOfKeys;
                placeholderData.schluessel = keys;
            }

            // placeholders testdatum2 to testdatum7
            const testDates = dataUtils.getCovidTestDates(tableData.anreise, tableData.abreise);
            placeholderData = { ...placeholderData, ...testDates };

            // placeholders nameTestpflicht1 to nameTestpflicht5
            // if no names have been found, only the name of the person who booked will appear as nameTestpflicht1
            if (namesAndBirthdates && namesAndBirthdates.length > 0) {
                const testNames = dataUtils.getCovidTestNames(namesAndBirthdates, tableData.anreise, tableData.abreise);
                placeholderData = { ...placeholderData, ...testNames };
            } else {
                placeholderData.nameTestpflicht1 = `${tableData.vorname} ${tableData.nachname}`;
            }
        }

        checkinGenerator.generate(placeholderData)
            .then(() => console.log("checkin docx generated"))
            .catch(error => alert(error));
    })

    // Dropdown "Sie"/"Du"
    document.getElementById('pronomen').addEventListener('change', event => {
        const pronomen = document.getElementById('pronomen');
        const anrede = document.getElementById('anrede');
        const firstVisit = document.getElementById('is_first_visit');

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
let result_table = null;

database.setup(refreshStatus);

buildUI();