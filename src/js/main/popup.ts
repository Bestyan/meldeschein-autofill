// for webpack (css needs to be referenced to be packed)
import "../../css/popup.css";

import { Tabulator, MutatorModule, SelectRowModule, PageModule, InteractionModule, FormatModule, RowComponent } from 'tabulator-tables';
import { Database } from './database/database';
import UI from './popup/ui';
import constants from './util/constants';
import { PopupController } from './popup/controller';

// enable mutators
Tabulator.registerModule([MutatorModule, SelectRowModule, PageModule, InteractionModule, FormatModule]);

const database = new Database(window);
const popupController = new PopupController(database);
const ui = new UI(popupController);

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
    ui.updateExcelDataStatus();

    // Button minimieren
    ui.initMinimizeButton();

    // Button maximieren
    ui.initMaximizeButton();

    // Button Einstellungen (Zahnrad)
    ui.initSettingsButton();

    // Button "Daten löschen"
    ui.initDeleteExcelDataButton();

    // Button "xls hochladen"
    ui.initUploadExcelButton();

    // Suchparameter (Dropdowns)
    ui.initSearchDropDowns();

    // Button/Form "suchen"
    ui.initSearchBookingsButton();

    // Button "WLAN Voucher ausfüllen"
    ui.initWlanVoucherFillButton();

    // Button "Check-in Dokument"
    ui.initCheckinDocumentButton();

    // init Mail Template dropdown
    ui.initMailTemplateNames();

    // Button [Mail] "erstellen"
    ui.initGenerateMailButton();

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