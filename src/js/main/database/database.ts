import localStorageDB from 'localStorageDB';
import constants, { Booking } from '../util/constants';
import connection from '../rest/connection';

const LOCALSTORAGE_LAST_UPLOAD = "xls_upload_datetime";

// bookings tables
const TABLE_BOOKINGS = "booking";

// apartment to key number mappings
const TABLE_KEYS = "keys";

const DB = new localStorageDB("meldeschein", "localStorage");

export default {
    xls_upload_datetime: window.localStorage.getItem(LOCALSTORAGE_LAST_UPLOAD),

    setup(refreshStatusFunc: Function) {
        this.refreshStatus = refreshStatusFunc;
    },

    resetBookingsTable() {
        // legacy tables
        if (DB.tableExists("raw_data")) {
            DB.dropTable("raw_data");
        }
        if (DB.tableExists("clean_data")) {
            DB.dropTable("clean_data");
        }

        // actually used tables

        DB.commit();
    },

    resetKeysTable() {
        if (DB.tableExists(TABLE_KEYS)) {
            DB.dropTable(TABLE_KEYS);
        }
        DB.commit();
    },

    /**
     * sets up bookings tables for use
     * @param {Array<any>} rows 
     */
    initBookings(rows: Array<Booking>) {
        /*
        clear old data and create table
        */
        this.resetBookingsTables();
        DB.createTable(TABLE_BOOKINGS, ["arrival", "departure", "apartment", "organiser_firstname", "organiser_lastname", "email", "meldeschein_groups", "isValid"]);

        rows.forEach(row => {


            // insert row TODO
            // DB.insert(TABLE_BOOKINGS, data);
            DB.commit();

        });
        this.setUploadTime();
    },

    /**
     * sets xls_upload_datetime to current time
     */
    setUploadTime() {
        this.xls_upload_datetime = new Date().toLocaleDateString('de-DE', constants.STATUS_DATE_FORMAT as Intl.DateTimeFormatOptions);
        window.localStorage.setItem(LOCALSTORAGE_LAST_UPLOAD, this.xls_upload_datetime);
        this.refreshStatus();
    },

    hasData() {
        return DB.tableExists(TABLE_BOOKINGS) && DB.queryAll(TABLE_BOOKINGS, {}).length > 0;
    },

    search(column: string, value: string) {
        if (!this.hasData()) {
            alert("Keine Daten. Bitte xls hochladen");
        }

        return DB.queryAll(TABLE_BOOKINGS, {
            query: (row: any) => row[column].toString().includes(value)
        });
    },

    /**
     * stub for server
     * Promise resolves into "M", "F" or "not in db"
     * @param {string} firstname 
     * @returns {Promise}
     */
    getGender(firstname: string) {
        return new Promise((resolve, reject) => {
            connection.get(
                constants.SERVER_GET_VORNAME,
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
    },

    /**
     * stub for server
     * @param {string} name 
     * @param {"F" | "M"} gender 
     */
    addFirstName(name: string, gender: "F" | "M") {
        connection.put(constants.SERVER_PUT_VORNAME, {
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
    },

    /**
     * 
     * @param {Array<any>} rows 
     */
    initKeys(rows: Array<any>) {
        this.resetKeysTable();
        try {
            DB.createTableWithData(TABLE_KEYS, rows);
            DB.commit();
        } catch (error) {
            alert(error.toString());
        }
    },

    /**
     * get all key numbers belonging to the given apartment
     * @param {string} apartment 
     * @param {number} maxKeys 
     * @returns {string[]}
     */
    getKeys(apartment: string, maxKeys: number) {
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
    }
}