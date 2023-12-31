// for webpack (css needs to be referenced to be packed)
import "../../css/popup.css";

import { Tabulator, MutatorModule, SelectRowModule, PageModule, InteractionModule, FormatModule, RowComponent } from 'tabulator-tables';
import mailGenerator from './popup/mail_generator';
import { Database } from './database/database';
import dataUtil from './util/data_util';
import uiHelper from './popup/ui_helper';
import UI from './popup/ui';
import constants from './util/constants';
import checkinGenerator from './popup/checkin_generator';
import contentScriptConnector from './content_scripts/connector';
import { GuestExcel, Booking } from "./database/guest_excel";
import 'regenerator-runtime/runtime'; // required by exceljs
import { Workbook } from 'exceljs';
import { PopupController } from './popup/controller';

// enable mutators
Tabulator.registerModule([MutatorModule, SelectRowModule, PageModule, InteractionModule, FormatModule]);

const database = new Database(refreshStatus, window);
const popupController = new PopupController(database);
const ui = new UI(popupController);

class Option {
    text: string;
    value: string;

    static of(text: string, value: string): Option {
        const option = new Option();
        option.value = value;
        option.text = text;
        return option;
    }
}

// dropdowns in popup
const SEARCH_OPTIONS = [
    Option.of("Anreise", "arrival"), 
    Option.of("Abreise", "departure"), 
    Option.of("Nachname", "organiserLastname"), 
    Option.of("Email", "email")];

// reads excel file
// TODO move to UI / controller
function handleExcelUpload(event: Event) {
    uiHelper.showLoadingOverlay();
    const reader = new FileReader();
    reader.onload = event => {
        const workbook = new Workbook();
        workbook.xlsx.load(event.target.result as ArrayBuffer).then((workbook: Workbook)=> {
            const guestExcel = new GuestExcel(workbook.worksheets[0]);
            database.initBookings(guestExcel.getBookings());
            uiHelper.hideLoadingOverlay();
            console.log(database.findAll());
        });
    };
    reader.readAsArrayBuffer((event.target as HTMLInputElement).files[0]);
}

function refreshStatus() {
    const status = document.getElementById("status");
    status.classList.remove("good", "bad");

    if (database.hasData()) {

        status.classList.add("good");
        status.innerHTML = `Daten vom ${database.xls_upload_datetime}`;

    } else {

        status.classList.add("bad");
        status.innerHTML = "keine Daten";
        return;
    }
}

/**
 * populate the popup.html <select> tags with <option> tags
 */
function setupSearchDropDowns() {

    const searchDropdown = uiHelper.getHtmlSelectElement("search_field");
    const searchDateInput = uiHelper.getHtmlInputElement("search_input_date");
    const searchTextInput = uiHelper.getHtmlInputElement("search_input_text");

    // anreise / abreise
    SEARCH_OPTIONS.forEach(entry => {
        let option = document.createElement("option");
        option.value = entry.value;
        option.innerHTML = entry.text;
        searchDropdown.append(option);
    });

    searchDropdown.addEventListener("change", event => {
        const selected = searchDropdown.value;
        searchDateInput.classList.remove("hide");
        searchTextInput.classList.remove("hide");
        if (selected === "arrival" || selected === "departure") {
            searchTextInput.classList.add("hide");
        } else {
            searchDateInput.classList.add("hide");
        }
    });

    // preset the anreise/abreise search field to today
    searchDateInput.value = new Date().toISOString().substring(0, "yyyy-mm-dd".length);

    // +1 day on the anreise/abreise search field
    document.getElementById("date_plus_one").addEventListener("click", event => {
        searchDateInput.stepUp(1);
    });
    // -1 day on the anreise/abreise search field
    document.getElementById("date_minus_one").addEventListener("click", event => {
        searchDateInput.stepUp(-1);
    });
}

function generateReviewMail() {
    const data = ui.getSelectedSearchResultsTableRow();
    if (data == null) {
        alert("keine Tabellenzeile ausgewählt");
        return;
    }

    // TODO
    //data.anrede = uiHelper.getHtmlSelectElement('anrede').value;
    const pronomen = uiHelper.getHtmlSelectElement('pronomen').value;
    const isFirstVisit = uiHelper.getHtmlSelectElement('is_first_visit').value == 'true';

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

function fillMeldeschein() {
    const data = ui.getSelectedSearchResultsTableRow() as any; //TODO
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
    ui.initMinimizeButton(document.getElementById('minimize'));

    // Button maximieren
    ui.initMaximizeButton(document.getElementById('maximize'));

    // Button Einstellungen (Zahnrad)
    ui.initSettingsButton(document.getElementById('settings'));

    // Button "Daten löschen"
    ui.initDeleteExcelDataButton(document.getElementById('delete'), refreshStatus);

    // Button "xls hochladen"
    document.getElementById('upload').addEventListener('change', handleExcelUpload, false);

    // Suchparameter (Dropdowns)
    setupSearchDropDowns();

    // Button/Form "suchen"
    document.getElementById('search').addEventListener('submit', (event: Event) => ui.searchBookings(event));

    // Button "Meldeschein ausfüllen"
    document.getElementById('meldeschein_fill').addEventListener("click", event => fillMeldeschein());

    // Button "WLAN Voucher ausfüllen"
    document.getElementById('wlan_voucher_fill').addEventListener('click', event => {
        const data = ui.getSelectedSearchResultsTableRow();
        if (data == null) {
            alert("keine Tabellenzeile ausgewählt");
            return;
        }

        // message to content script fill_vlan_voucher.js
        contentScriptConnector.send({
            hotspot: dataUtil.getHotspot(data.apartment),
            gueltigkeit: dataUtil.getVoucherGueltigkeit(data.departure),
            kommentar: dataUtil.getVoucherKommentar(data)
        });
    });

    // Button "Check-in Dokument"
    document.getElementById('checkin_download').addEventListener('click', event => {
        const tableData = ui.getSelectedSearchResultsTableRow();
        // create placeholder mappings from selected table row. if no row is selected, blank lines will be generated instead
        let placeholderData: any = null;
        if (tableData != null) {
            placeholderData = {
                apartment: tableData.apartment,
                aufenthaltszeit: `${tableData.arrival} ‒ ${tableData.departure}`,
                anreise: tableData.arrival,
            };

            // name placeholders are name1, name2, name3 etc
            // if no names have been found, only the name of the person who booked will appear as name1
            // const guests = database.getGuests(tableData);
            if(false) { // TODO

            } else {
                placeholderData.name1 = `${tableData.organiserFirstname} ${tableData.organiserLastname}`;
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
        const pronomen = uiHelper.getHtmlSelectElement('pronomen');
        const anrede = uiHelper.getHtmlSelectElement('anrede');
        const firstVisit = uiHelper.getHtmlSelectElement('is_first_visit');

        if (pronomen.value === "Sie") {

            anrede.removeAttribute("disabled");
            firstVisit.removeAttribute("disabled");

        } else if (pronomen.value === "Du") {

            anrede.setAttribute("disabled", "disabled");
            firstVisit.setAttribute("disabled", "disabled");

        }
    })

    // Button [Mail] "erstellen"
    document.getElementById('generate').addEventListener('click', generateReviewMail, false);

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

buildUI();