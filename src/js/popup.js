import XLSX from 'xlsx';
import localStorageDB from 'localstoragedb';

const TABLENAME = "buchungsdaten";
const DB = new localStorageDB("meldeschein", localStorage);

/**
 * reads xls to json
 * @param {Event} e 
 */
function handleFile(e) {
    let files = e.target.files,
        f = files[0];
    let reader = new FileReader();
    reader.onload = e => {
        let data = new Uint8Array(e.target.result);
        let workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true
        });

        /*
            TODO: modify column names to not contain forbidden characters
        */
        let sheet = workbook.Sheets[workbook.SheetNames[0]];
        console.log(sheet);


        let sheet_as_json = XLSX.utils.sheet_to_json(sheet);
        //console.log(sheet_as_json);

        updateDB(sheet_as_json)
    };
    reader.readAsArrayBuffer(f);
}

/**
 * 
 * @param {JSON} rows 
 */
function updateDB(rows) {
    initDB(rows);
}

/**
 * sets up db for use
 * @param {JSON} rows 
 */
function initDB(rows) {
    /*
        clear old data and create table
    */
    if (DB.tableExists(TABLENAME)) {
        // delete old data
        DB.dropTable(TABLENAME);
    }
    DB.createTableWithData(TABLENAME, rows);

    /*
        reformat column Kunde to Vorname, Nachname
    */
    DB.alterTable(TABLENAME, ["Vorname", "Nachname"], "");
    DB.update(TABLENAME, {}, row => {
        try {

            let name = row.Kunde.split(",");
            let vorname = name[1].trim(), nachname = name[0].trim();
            row.Vorname = vorname;
            row.Nachname = nachname;

        } catch (exception) {

            console.error(`bad data in column Kunde: ${row.Kunde}`);

        }
    });
    DB.commit();

    console.log(DB.queryAll(TABLENAME));
}

document.getElementById('upload').addEventListener('change', handleFile, false);