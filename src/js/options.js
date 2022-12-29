import "../css/options.css";
import constants from "./constants";
import email from "./email";
import XLSX from 'xlsx';
import db from './database';

/**
 * Set save message in specified field
 * @param {string} message 
 * @param {string} divId id of the field which displays the message
 * @param {string} cssClass 'good'|'bad' (colors the text green or red)
 */
const setSaveMessage = (message, divId, cssClass) => {
    const errorDiv = document.getElementById(divId);
    errorDiv.textContent = message;
    errorDiv.classList.remove("good", "bad");
    errorDiv.classList.add(cssClass);
}

/**
 * set the text and the css of the email status field  
 * removes all css classes from the field before setting new ones
 * @param {string} text 
 * @param  {...string} cssClasses 
 */
const setEmailStatus = (text, ...cssClasses) => {
    const status = document.getElementById("status");
    status.classList.remove("good", "bad");
    status.textContent = text;
    status.classList.add(cssClasses);
}

/**
 * set the html content and the css classes of the checkin doc status field  
 * removes all css classes from the field before setting new ones
 * @param {string} htmlContent 
 * @param  {...string} cssClasses 
 */
const setCheckInDocStatus = (htmlContent, ...cssClasses) => {
    const uploadStatus = document.getElementById("checkin_docx_status");
    // remove all classes
    uploadStatus.classList.remove(...uploadStatus.classList);
    uploadStatus.innerHTML = htmlContent;
    uploadStatus.classList.add("bold", cssClasses);
};

/**
 * set the html content and the css classes of the keys xls status field  
 * removes all css classes from the field before setting new ones
 * @param {string} htmlContent 
 * @param  {...string} cssClasses 
 */
const setKeysXlsStatus = (htmlContent, ...cssClasses) => {
    const uploadStatus = document.getElementById("keys_xls_status");
    // remove all classes
    uploadStatus.classList.remove(...uploadStatus.classList);
    uploadStatus.innerHTML = htmlContent;
    uploadStatus.classList.add("bold", cssClasses);
};

/**
 * set the html content and the css classes of the invoice xlsx status field  
 * removes all css classes from the field before setting new ones
 * @param {string} htmlContent 
 * @param  {...string} cssClasses 
 */
const setInvoiceXlsxStatus = (htmlContent, ...cssClasses) => {
    const uploadStatus = document.getElementById("invoice_xlsx_status");
    // remove all classes
    uploadStatus.classList.remove(...uploadStatus.classList);
    uploadStatus.innerHTML = htmlContent;
    uploadStatus.classList.add("bold", cssClasses);
};

/**
 * check local storage for existing checkin docx and set status field accordingly
 */
const refreshCheckInDocStatus = () => {
    // check for an existing checkin docx
    let currentDocx = window.localStorage.getItem(constants.SETTINGS_CHECKIN_DOCX);
    // set status accordingly
    if (currentDocx === null) {
        setCheckInDocStatus("fehlt &cross;", "bad");
    } else {
        setCheckInDocStatus("vorhanden &check;", "good");
    }
};

/**
 * check local storage for existing keys xls and set status field accordingly
 */
const refreshKeysXlsStatus = () => {
    // check for an existing keys xls
    let currentXls = window.localStorage.getItem(constants.SETTINGS_KEYS_XLS);
    // set status accordingly
    if (currentXls === null) {
        setKeysXlsStatus("fehlt &cross;", "bad");
    } else {
        setKeysXlsStatus("vorhanden &check;", "good");
    }
};

/**
 * check local storage for existing invoice xlsx and set status field accordingly
 */
const refreshInvoiceXlsxStatus = () => {
    // check for an existing invoice xslx
    let currentInvoiceXlsx = window.localStorage.getItem(constants.SETTINGS_INVOICE_XLSX);
    // set status accordingly
    if (currentInvoiceXlsx === null) {
        setInvoiceXlsxStatus("fehlt &cross;", "bad");
    } else {
        setInvoiceXlsxStatus("vorhanden &check;", "good");
    }
};

// initialize the email settings section
function buildMailSettingsUI() {

    const userInput = document.getElementById("email_user");
    const passwordInput = document.getElementById("email_password");
    const hostInput = document.getElementById("email_host");
    const portInput = document.getElementById("email_port");
    const tlsCheckbox = document.getElementById("email_tls");

    const loadEmailSettingsFromStorage = () => {
        const settings_string = window.localStorage.getItem(constants.SETTINGS_EMAIL);

        if (!settings_string) {

            userInput.value = "";
            passwordInput.value = "";
            hostInput.value = "";
            portInput.value = "993";
            tlsCheckbox.checked = true;

        } else {

            const settings = JSON.parse(settings_string);

            userInput.value = settings.user;
            passwordInput.value = "";
            hostInput.value = settings.host;
            portInput.value = settings.port;
            tlsCheckbox.checked = settings.tls;

        }
    };

    // Button speichern
    document.getElementById("save").addEventListener("click", event => {
        // check for empty inputs
        if (!userInput.value ||
            !passwordInput.value ||
            !hostInput.value ||
            !portInput.value) {
            setSaveMessage("nicht alle Felder ausgefüllt", "save_email_message", "bad");
            return;
        }

        // check if port is a number
        if (!+portInput.value) {
            setSaveMessage("Port muss eine Zahl sein", "save_email_message", "bad");
            return;
        }

        const settings = {
            user: userInput.value,
            password: passwordInput.value,
            host: hostInput.value,
            port: portInput.value,
            tls: tlsCheckbox.checked
        };

        // save settings to local storage
        window.localStorage.setItem(constants.SETTINGS_EMAIL, JSON.stringify(settings));

        // test connection
        setEmailStatus("Login testen ...", "bad");
        email.testConnection()
            .then(
                responseBody => {
                    if (responseBody.status === "ok") {
                        setEmailStatus("Login erfolgreich", "good");
                    } else {
                        setEmailStatus(responseBody.error, "bad");
                    }
                    setSaveMessage("Email gespeichert", "save_email_message", "good");
                })
            .catch(error => setSaveMessage(error, "save_email_message", "bad"));
    });

    document.getElementById("wipe").addEventListener("click", event => {
        window.localStorage.clear();
        refreshCheckInDocStatus();
    })

    loadEmailSettingsFromStorage();
}

// initialize the check-in document section
function buildCheckinDocumentUI() {
    const uploadButton = document.getElementById("upload_checkin");

    refreshCheckInDocStatus();

    uploadButton.addEventListener("change", event => {

        setCheckInDocStatus("lädt...", "bad");

        const toBinaryString = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsBinaryString(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

        const file = event.target.files[0];

        toBinaryString(file)
            .then(binaryString => {
                // save to local storage
                window.localStorage.setItem(constants.SETTINGS_CHECKIN_DOCX, binaryString);
                refreshCheckInDocStatus();
            })
            .catch(error => setCheckInDocStatus(error.toString(), "bad"));
    });

}

// initialize the keys section
function buildKeysUI() {
    const uploadButton = document.getElementById("upload_keys");

    refreshKeysXlsStatus();

    uploadButton.addEventListener("change", event => {

        setKeysXlsStatus("lädt...", "bad");

        let files = event.target.files,
            f = files[0];
        const reader = new FileReader();
        reader.onload = e => {
            try {

                let data = new Uint8Array(e.target.result);
                let workbook = XLSX.read(data, {
                    type: 'array'
                });

                // get first sheet
                let sheet = workbook.Sheets[workbook.SheetNames[0]];
                let sheet_as_json = XLSX.utils.sheet_to_json(sheet);

                // save keys to database
                db.initKeys(sheet_as_json);
                window.localStorage.setItem(constants.SETTINGS_KEYS_XLS, "saved");
                refreshKeysXlsStatus();

            } catch (error) {
                console.log(error);
            }
        };
        reader.readAsArrayBuffer(f);
    });

}

/**
 * initialize the invoice section
 */
function buildInvoiceUI() {
    const uploadButton = document.getElementById("upload_invoice");

    refreshInvoiceXlsxStatus();

    uploadButton.addEventListener("change", event => {

        setInvoiceXlsxStatus("lädt...", "bad");

        // convert binary buffer to base64
        const arrayBufferToBase64 = buffer => {
            const bytes = new Uint8Array(buffer);
            const chars = [];
            const length = bytes.byteLength;
            for (let i = 0; i < length; i++) {
                chars.push(String.fromCharCode(bytes[i]))
            }
            const binary = chars.join('');
            return window.btoa(binary);
        }

        // function to read file to base64
        const toArrayBuffer = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = () => resolve(arrayBufferToBase64(reader.result));
            reader.onerror = error => reject(error);
        });



        const file = event.target.files[0];

        toArrayBuffer(file)
            .then(buffer => {
                // save to local storage
                window.localStorage.setItem(constants.SETTINGS_INVOICE_XLSX, buffer);
                refreshInvoiceXlsxStatus();
            })
            .catch(error => setCheckInDocStatus(error.toString(), "bad"));
    });

}

function buildKurbeitragUI() {
    const adultsInput = document.getElementById("kurbeitrag_erwachsene");
    const childrenInput = document.getElementById("kurbeitrag_kinder");
    const toddlersInput = document.getElementById("kurbeitrag_kleinkinder");

    // load Kurbeitrag values from local storage
    (() => { // fancy scoping
        const kurbeitragJSON = window.localStorage.getItem(constants.SETTINGS_KURBEITRAG);
        if (kurbeitragJSON != null) {
            const { adults, children, toddlers } = JSON.parse(kurbeitragJSON);
            adultsInput.value = adults.toFixed(2);
            childrenInput.value = children.toFixed(2);
            toddlersInput.value = toddlers.toFixed(2);
        }
    })();

    // speichern
    document.getElementById("save_kurbeitrag").addEventListener("click", event => {
        try {
            const adults = +adultsInput.value.replace(",", ".");
            const children = +childrenInput.value.replace(",", ".");
            const toddlers = +toddlersInput.value.replace(",", ".");

            const kurbeitrag = {
                adults: adults, // 16+
                children: children, // 6-15
                toddlers: toddlers // 0-5
            };

            window.localStorage.setItem(constants.SETTINGS_KURBEITRAG, JSON.stringify(kurbeitrag));
            setSaveMessage("Kurbeitrag gespeichert", "save_kurbeitrag_message", "good");
        } catch (error) {
            setSaveMessage("ungültiger Wert in einem der Kurbeitragsfelder", "save_kurbeitrag_message", "bad");
        }
    });
}

/**
 * initialize all the sections
 */
function buildUI() {
    buildMailSettingsUI();
    buildCatchAllSettingsUI();
    buildCheckinDocumentUI();
    buildKeysUI();
    buildInvoiceUI();
    buildKurbeitragUI();
}

buildUI();