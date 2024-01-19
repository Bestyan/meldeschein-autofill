// for webpack (css needs to be referenced to be packed)
import "../../css/popup.css";

import { Tabulator, MutatorModule, SelectRowModule, PageModule, InteractionModule, FormatModule, RowComponent } from 'tabulator-tables';
import mailGenerator from './popup/mail_generator';
import { Database } from './database/database';
import dataUtil from './util/data_util';
import uiHelper from './util/ui_helper';
import UI from './popup/ui';
import constants from './util/constants';
import contentScriptConnector from './content_scripts/connector';
import { GuestExcel } from "./database/guest_excel";
import 'regenerator-runtime/runtime'; // required by exceljs
import { Workbook } from 'exceljs';
import { PopupController } from './popup/controller';

// enable mutators
Tabulator.registerModule([MutatorModule, SelectRowModule, PageModule, InteractionModule, FormatModule]);

const database = new Database(window);
const popupController = new PopupController(database);
const ui = new UI(popupController);

// reads excel file
// TODO move to UI / controller
function handleExcelUpload(event: Event) {
    uiHelper.showLoadingOverlay();
    const reader = new FileReader();
    reader.onload = event => {
        const workbook = new Workbook();
        workbook.xlsx.load(event.target.result as ArrayBuffer).then((workbook: Workbook)=> {
            const guestExcel = new GuestExcel(workbook.worksheets[0]);
            database.initBookings(guestExcel.getBookings(), refreshStatus);
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
        status.innerHTML = `Daten vom ${database.guestXlsUploadDatetime}`;

    } else {

        status.classList.add("bad");
        status.innerHTML = "keine Daten";
        return;
    }
}

function generateReviewMail() {
    const data = ui.getSelectedSearchResultsData();
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
    fetch(constants.getServerURL() + constants.server.endpoints.wakeUp)
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
    ui.initSearchDropDowns();

    // Button/Form "suchen"
    document.getElementById('search').addEventListener('submit', (event: Event) => ui.searchBookings(event));

    // Button "WLAN Voucher ausfüllen"
    document.getElementById('wlan_voucher_fill').addEventListener('click', event => {
        const data = ui.getSelectedSearchResultsData();
        if (data == null) {
            alert("keine Tabellenzeile ausgewählt");
            return;
        }

        // message to content script fill_vlan_voucher.js
        contentScriptConnector.send({
            hotspot: dataUtil.getHotspotName(data.apartment),
            gueltigkeit: dataUtil.getVoucherDuration(data.departure),
            kommentar: dataUtil.getVoucherComment(data)
        });
    });

    // Button "Check-in Dokument"
    ui.initCheckinDocumentButton();

    // init Mail Template dropdown
    ui.initMailTemplateNames();

    // Button [Mail] "erstellen"
    document.getElementById('generate').addEventListener('click', generateReviewMail, false);

    // Visibility of Buttons
    chrome.tabs.query({
        currentWindow: true,
        active: true
    },
        tabs => {
            let url = tabs[0].url || "";

            const wlan_voucher_fill_button = document.getElementById('wlan_voucher_fill');

            wlan_voucher_fill_button.classList.remove('hide');

            if (!url.toString().includes('192.168.1.254:44444') &&
                !url.toString().includes('file://')) {
                wlan_voucher_fill_button.classList.add('hide');
            }
        });
}

wakeServer();
console.log(`environment: ${process.env.NODE_ENV}`);

buildUI();