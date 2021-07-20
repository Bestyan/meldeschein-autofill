import localStorageDB from 'localstoragedb';
import util from './data_utils';
import constants from './constants';
import connection from './connection';

const LOCALSTORAGE_LAST_UPLOAD = "xls_upload_datetime";

const TABLE_RAW = "raw_data";
const TABLE_SEARCH = "clean_data";

// columns of the SEARCH table
const COLUMNS_SEARCH = ["vorname", "nachname", "anschrift", "strasse", "plz", "ort", "land", "anreise", "abreise", "apartment", "personen", "vermerk", "email", "namen"];

const DB = new localStorageDB("meldeschein", localStorage);

export default {
    xls_upload_datetime: window.localStorage.getItem(LOCALSTORAGE_LAST_UPLOAD),

    setup(refreshStatusFunc) {
        this.refreshStatus = refreshStatusFunc;
    },

    resetBookingsTables() {
        if (DB.tableExists(TABLE_RAW)) {
            DB.dropTable(TABLE_RAW);
        }
        if (DB.tableExists(TABLE_SEARCH)) {
            DB.dropTable(TABLE_SEARCH);
        }
        DB.commit();
    },

    /**
     * sets up db for use
     * @param {JSON} rows 
     */
    initDB(rows) {
        /*
        clear old data and create table
        */
        this.resetBookingsTables();
        DB.createTableWithData(TABLE_RAW, rows);
        DB.createTable(TABLE_SEARCH, COLUMNS_SEARCH);

        let raw_rows = DB.queryAll(TABLE_RAW);
        raw_rows.forEach(row => {

            try {
                row.Anreise.toLocaleDateString("de-DE", constants.SEARCH_RESULT_DATE_FORMAT);
                row.Abreise.toLocaleDateString("de-DE", constants.SEARCH_RESULT_DATE_FORMAT);
            } catch (error) {
                alert(`one of the data sets in the uploaded xls is invalid: 

                Kunde ${row.Kunde}
                Anreise ${row.Anreise}
                Abreise ${row.Abreise}
                
                Please fix and try again!`);
                return;
            }

            let data = {
                ...util.processKunde(row.Kunde), // extract vorname, nachname from Kunde
                anschrift: row.Anschrift,
                ...util.processAnschrift(row.Anschrift), // extract strasse, plz, ort, land
                anreise: row.Anreise.toLocaleDateString("de-DE", constants.SEARCH_RESULT_DATE_FORMAT),
                abreise: row.Abreise.toLocaleDateString("de-DE", constants.SEARCH_RESULT_DATE_FORMAT),
                apartment: util.processApartment(row.Name_der_gebuchten_Leistung),
                personen: row.Personen,
                vermerk: row.Interner_Vermerk,
                email: row.EMail,
                namen: []
            };

            // insert row
            DB.insert(TABLE_SEARCH, data);
            DB.commit();

        });
        this.setUploadTime();
    },

    /**
     * sets xls_upload_datetime to current time
     */
    setUploadTime() {
        this.xls_upload_datetime = new Date().toLocaleDateString('de-DE', constants.STATUS_DATE_FORMAT);
        window.localStorage.setItem(LOCALSTORAGE_LAST_UPLOAD, this.xls_upload_datetime);
        this.refreshStatus();
    },

    hasData() {
        return DB.tableExists(TABLE_SEARCH) && DB.queryAll(TABLE_SEARCH).length > 0;
    },

    search(params) {
        if (!this.hasData()) {
            alert("Keine Daten. Bitte xls hochladen");
        }

        if (params.length === 0) {
            return DB.queryAll(TABLE_SEARCH);
        } else {
            return DB.queryAll(TABLE_SEARCH, {
                query: row => {
                    for (const [key, value] of Object.entries(params)) {
                        if (!(row[key] + "").includes(value)) {
                            return false;
                        }
                    }
                    return true;
                }
            });
        }
    },

    /**
     * stub for server
     * Promise resolves into "M", "F" or "not in db"
     * @param {*} firstname 
     * @returns {Promise}
     */
    getGender(firstname) {

        return new Promise((resolve, reject) => {
            connection.get(
                constants.SERVER_GET_VORNAME,
                [{
                    key: "name",
                    value: firstname
                }]
            )
                .then(response => response.json())
                .then(json => {

                    if (connection.isOk(json)) {
                        if (json.data && json.data.gender) {
                            resolve(json.data.gender);
                        } else {
                            resolve(json.data);
                        }
                    } else {
                        reject(json.error);
                    }

                })
                .catch(error => reject(error.toString()));
        });
    },

    /**
     * stub for server
     * @param {*} name 
     * @param {*} gender 
     */
    addFirstName(name, gender) {
        connection.put(constants.SERVER_PUT_VORNAME, {
            name: name,
            gender: gender
        })
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
     * @param {*} row 
     * @param {*} names array of names
     */
    setNames(row, names) {
        DB.update(TABLE_SEARCH, {
            vorname: row.vorname,
            nachname: row.nachname,
            anschrift: row.anschrift,
            anreise: row.anreise,
            abreise: row.abreise,
            apartment: row.apartment,
            email: row.email
        }, rowToBeUpdated => {
            rowToBeUpdated.namen = names;
            return rowToBeUpdated;
        });
        DB.commit();
    },

    /**
     * 
     * @param {*} row 
     */
    getNames(row) {
        delete row.namen;
        const rows = DB.queryAll(TABLE_SEARCH, {
            query: {
                vorname: row.vorname,
                nachname: row.nachname,
                anschrift: row.anschrift,
                anreise: row.anreise,
                abreise: row.abreise,
                apartment: row.apartment,
                email: row.email
            }
        });

        if (rows.length == 0 || rows.length >= 2) {
            return null;
        }

        return rows[0].namen;
    }
}