import "../../css/options.css";
import constants from "./util/constants";
import XLSX from 'xlsx';
import database from './database/database';

/**
 * set the html content and the css classes of the checkin doc status field  
 * removes all css classes from the field before setting new ones
 */
const setCheckInDocStatus = (htmlContent: string, ...cssClasses: string[]) => {
    const uploadStatus = document.getElementById("checkin_docx_status");
    // remove all classes
    uploadStatus.classList.remove(...uploadStatus.classList);
    uploadStatus.innerHTML = htmlContent;
    uploadStatus.classList.add("bold", ...cssClasses);
};

/**
 * set the html content and the css classes of the keys xls status field  
 * removes all css classes from the field before setting new ones
 */
const setKeysXlsStatus = (htmlContent: string, ...cssClasses: string[]) => {
    const uploadStatus = document.getElementById("keys_xls_status");
    // remove all classes
    uploadStatus.classList.remove(...uploadStatus.classList);
    uploadStatus.innerHTML = htmlContent;
    uploadStatus.classList.add("bold", ...cssClasses);
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

// initialize the check-in document section
function buildCheckinDocumentUI() {
    const uploadButton = document.getElementById("upload_checkin");

    refreshCheckInDocStatus();

    uploadButton.addEventListener("change", event => {

        setCheckInDocStatus("lädt...", "bad");

        const toBinaryString = (file: File) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsBinaryString(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

        const file = (event.target as HTMLInputElement).files[0];

        toBinaryString(file)
            .then((binaryString: string) => {
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

        let files = (event.target as HTMLInputElement).files,
            f = files[0];
        const reader = new FileReader();
        reader.onload = event => {
            try {

                let data = new Uint8Array(event.target.result as ArrayBuffer);
                let workbook = XLSX.read(data, {
                    type: 'array'
                });

                // get first sheet
                let sheet = workbook.Sheets[workbook.SheetNames[0]];
                let sheet_as_json = XLSX.utils.sheet_to_json(sheet);

                // save keys to database
                database.initKeys(sheet_as_json);
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
 * initialize all the sections
 */
function buildUI() {
    buildCheckinDocumentUI();
    buildKeysUI();
}

buildUI();