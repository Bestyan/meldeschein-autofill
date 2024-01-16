import "../../css/options.css";
import constants from "./util/constants";
import XLSX from 'xlsx';
import { Database } from './database/database';
import uiHelper from './util/ui_helper';

const database = new Database(() => { }, window);

/**
 * set the html content and the css classes of the checkin doc status field  
 * removes all css classes from the field before setting new ones
 */
const setCheckInDocStatus = (status: "red" | "yellow" | "green") => {
    const uploadStatus = document.getElementById("checkin_docx_status");
    uiHelper.setTrafficLightEmoji(uploadStatus, status);
};

/**
 * set the html content and the css classes of the keys xls status field  
 * removes all css classes from the field before setting new ones
 */
const setKeysXlsStatus = (status: "red" | "yellow" | "green") => {
    const uploadStatus = document.getElementById("keys_xls_status");
    uiHelper.setTrafficLightEmoji(uploadStatus, status);
};

/**
 * check local storage for existing checkin docx and set status field accordingly
 */
const refreshCheckInDocStatus = () => {
    // check for an existing checkin docx
    let currentDocx = window.localStorage.getItem(constants.localStorage.keys.checkinDocxAsBinaryText);
    // set status accordingly
    if (currentDocx === null) {
        setCheckInDocStatus("red");
    } else {
        setCheckInDocStatus("green");
    }
};

/**
 * check local storage for existing keys xls and set status field accordingly
 */
const refreshKeysXlsStatus = () => {
    // check for an existing keys xls
    let currentXls = window.localStorage.getItem(constants.localStorage.keys.keysXlsStatus);
    // set status accordingly
    if (currentXls === null) {
        setKeysXlsStatus("red");
    } else {
        setKeysXlsStatus("green");
    }
};

// initialize the check-in document section
function buildCheckinDocumentUI() {
    const uploadButton = document.getElementById("upload_checkin");

    refreshCheckInDocStatus();

    uploadButton.addEventListener("change", event => {

        setCheckInDocStatus("yellow");

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
                window.localStorage.setItem(constants.localStorage.keys.checkinDocxAsBinaryText, binaryString);
                refreshCheckInDocStatus();
            })
            .catch(error => {
                console.error(error)
                setCheckInDocStatus("red")
            });
    });

}

// initialize the keys section
function buildKeysUI() {
    const uploadButton = document.getElementById("upload_keys");

    refreshKeysXlsStatus();

    uploadButton.addEventListener("change", event => {

        setKeysXlsStatus("yellow");

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
                database.initKeysTable(sheet_as_json);
                window.localStorage.setItem(constants.localStorage.keys.keysXlsStatus, "saved");
                refreshKeysXlsStatus();

            } catch (error) {
                console.error(error);
                setKeysXlsStatus("red");
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