import XLSX from 'xlsx';
import Database from '../database/database';
import constants from "../util/constants";
import dataUtil from '../util/data_util';

export class OptionsController {
    database: Database;

    constructor(database: Database) {
        this.database = database;
    };

    uploadKeysXls(uploadElement: HTMLInputElement, onSuccess: Function, onError: Function) {
        const file = uploadElement.files[0];
        const reader = new FileReader();
        reader.onload = event => {
            try {

                const data = new Uint8Array(event.target.result as ArrayBuffer);
                const workbook = XLSX.read(data, {
                    type: 'array'
                });

                // get first sheet
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const sheet_as_json = XLSX.utils.sheet_to_json(sheet);

                // save keys to database
                this.database.initKeysTable(sheet_as_json);
                window.localStorage.setItem(constants.localStorage.keys.keysXlsStatus, "saved");
                onSuccess();

            } catch (error) {
                console.error(error);
                onError();
            }
        };
        reader.readAsArrayBuffer(file);
    };

    uploadMailTemplate(uploadElement: HTMLInputElement, localStorageKey: string, onSuccess: Function, onError: Function) {
        const file = uploadElement.files[0];
        dataUtil.readTextFile(file)
            .then(text => {
                window.localStorage.setItem(localStorageKey, text);
                onSuccess();
            })
            .catch(error => {
                console.error(error);
                onError();
            })
    };
};