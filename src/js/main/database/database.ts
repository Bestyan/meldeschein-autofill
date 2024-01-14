import localStorageDB from 'localStorageDB';
import constants from '../util/constants';
import connection from '../rest/connection';
import { Booking } from '../database/guest_excel';

const LOCALSTORAGE_LAST_UPLOAD = "xls_upload_datetime";

// bookings tables
const TABLE_BOOKINGS = "booking";

// apartment to key number mappings
const TABLE_KEYS = "keys";

const DB = new localStorageDB("meldeschein", "localStorage");

export class Database {
    localStorage: Window["localStorage"];
    updateExcelDataStatus: () => void;
    xls_upload_datetime: string;

    constructor(updateExcelDataStatus: () => void, window: Window) {
        this.updateExcelDataStatus = updateExcelDataStatus;
        this.localStorage = window.localStorage;
        this.xls_upload_datetime = this.localStorage.getItem(LOCALSTORAGE_LAST_UPLOAD);
    };

    resetBookingsTable() {
        // legacy tables
        if (DB.tableExists("raw_data")) {
            DB.dropTable("raw_data");
        }
        if (DB.tableExists("clean_data")) {
            DB.dropTable("clean_data");
        }

        // actually used tables
        if (DB.tableExists(TABLE_BOOKINGS)) {
            DB.dropTable(TABLE_BOOKINGS);
        }

        DB.commit();
    };

    resetKeysTable() {
        if (DB.tableExists(TABLE_KEYS)) {
            DB.dropTable(TABLE_KEYS);
        }
        DB.commit();
    };

    /**
     * sets up bookings tables for use
     */
    initBookings(bookings: Array<Booking>) {
        /*
        clear old data and create table
        */
        this.resetBookingsTable();
        DB.createTableWithData(TABLE_BOOKINGS, bookings);
        DB.commit();
        this.setUploadTime();
    };

    /**
     * sets xls_upload_datetime to current time
     */
    setUploadTime() {
        this.xls_upload_datetime = new Date().toLocaleDateString('de-DE', constants.STATUS_DATE_FORMAT as Intl.DateTimeFormatOptions);
        window.localStorage.setItem(LOCALSTORAGE_LAST_UPLOAD, this.xls_upload_datetime);
        this.updateExcelDataStatus();
    };

    hasData() {
        return DB.tableExists(TABLE_BOOKINGS) && DB.queryAll(TABLE_BOOKINGS, {}).length > 0;
    };

    findAll(){
        return DB.queryAll(TABLE_BOOKINGS, {});
    };

    search(column: string, value: string): Array<Booking> {
        console.log(`database.search(${column}, ${value})`);
        if (!this.hasData()) {
            alert("Keine Daten. Bitte xls hochladen");
        }

        const queryResult = DB.queryAll(TABLE_BOOKINGS, {
            query: (row: any) => {
                const rowString: string = JSON.stringify(row[column]);
                return rowString.toLowerCase().includes((value || "").toLowerCase());
            }
        });

        return queryResult.map((row: any) => Booking.fromQueryResult(row));
    };

    /**
     * stub for server
     * Promise resolves into "M", "F" or "not in db"
     */
    getGender(firstname: string) {
        return new Promise((resolve, reject) => {
            connection.get(
                constants.ENDPOINT_FIRSTNAME,
                [{
                    key: "name",
                    value: firstname
                }],
                null
            )
                .then(response => response.json())
                .then(json => {

                    if (!connection.isOk(json)) {
                        reject(json.error);
                        return;
                    }

                    if (json.data && json.data.gender) {
                        resolve(json.data.gender);
                        return;
                    }

                    resolve(json.data);
                })
                .catch(error => reject(error.toString()));
        });
    };

    /**
     * stub for server
     * @param {string} name 
     * @param {"F" | "M"} gender 
     */
    addFirstName(name: string, gender: "F" | "M") {
        connection.put(constants.ENDPOINT_FIRSTNAME, {
            name: name,
            gender: gender,
        }, null)
            .then(response => response.json())
            .then(json => {
                // we don't really care about the outcome as long as it's not an error
                if (!connection.isOk(json)) {
                    console.log(json.error);
                }
            })
            .catch(error => console.log(error));
    };

    initKeysTable(rows: Array<any>) {
        this.resetKeysTable();
        try {
            DB.createTableWithData(TABLE_KEYS, rows);
            DB.commit();
        } catch (error) {
            alert(error.toString());
        }
    };

    /**
     * get all key numbers belonging to the given apartment
     * @param {string} apartment 
     * @param {number} maxKeys 
     * @returns {string[]}
     */
    getApartmentKeyNames(apartment: string, maxKeys: number): Array<string> {
        const rows = DB.queryAll(TABLE_KEYS, {
            query: {
                apartment: apartment
            }
        });

        if (rows.length == 0 || rows.length >= 2) {
            console.warn(`found ${rows.length} rows. result is potentially ambiguous`);
            console.warn(JSON.stringify(rows));
            return null;
        }

        // convert json structure {apartment: "lilien", key1: "a1", key2: "a2", key3: "a2"} to ["a1", "a2", "a3"]
        const row = rows[0];
        const keys = [];
        for (let i = 1; i <= maxKeys; i++) {
            const key = row[`key${i}`];
            if (key != null &&
                key.length > 0) {
                keys.push(key);
            }
        }
        return keys;
    };
}

export default Database;