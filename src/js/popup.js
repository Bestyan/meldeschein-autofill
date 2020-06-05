import XLSX from 'xlsx';
import localStorageDB from 'localstoragedb';

const RAW_TABLE = "raw_data";
const SEARCH_TABLE = "clean_data";
const DB = new localStorageDB("meldeschein", localStorage);
const COLUMNS = [];

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
            modify column names to not contain forbidden characters
        */
        let sheet = workbook.Sheets[workbook.SheetNames[0]];
        console.log(sheet);
        for (let i = 65; i < 100; i++) {
            let cellName = String.fromCharCode(i) + '1';
            let cell = sheet[cellName];
            if (cell === undefined) {
                break;
            }
            cell.w = cell.w.replace(/ä/g, "ae")
                .replace(/ö/g, "oe")
                .replace(/ü/g, "ue")
                .replace(/ß/g, "ss")
                .replace(/[ \/]/g, "_")
                .replace(/#/g, "Nr");
            COLUMNS.push(cell.w);
        }

        /*
            hand over to database
        */
        let sheet_as_json = XLSX.utils.sheet_to_json(sheet);
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
    if (DB.tableExists(RAW_TABLE)) {
        DB.dropTable(RAW_TABLE);
    }
    DB.createTableWithData(RAW_TABLE, rows);

    if (DB.tableExists(SEARCH_TABLE)) {
        DB.dropTable(SEARCH_TABLE);
    }
    DB.createTable(SEARCH_TABLE, ["vorname", "nachname", "anschrift", "strasse", "plz", "ort", "land", "anreise", "abreise", "apartment", "personen", "vermerk", "email"]);

    /*
        reformat column Kunde to Vorname, Nachname
    */
    let raw_rows = DB.queryAll(RAW_TABLE);
    raw_rows.forEach(row => {
        let data = {
            vorname: "",
            nachname: "",
            anschrift: row.Anschrift,
            strasse: "",
            plz: "",
            ort: "",
            land: "",
            anreise: row.Anreise,
            abreise: row.Abreise,
            apartment: "",
            personen: row.Personen,
            vermerk: row.Interner_Vermerk,
            email: row.EMail
        };
        // extract vorname, nachname from Kunde
        try {

            let name = row.Kunde.split(",");
            data.vorname = name[1].trim();
            data.nachname = name[0].trim();

        } catch (exception) {

            console.log(`non-conforming data in column Kunde: "${row.Kunde}". Retrying...`);
            /*
                retry with a space as the delimiter
            */
            try {
                let name = row.Kunde.trim().split(" ");
                data.vorname = name[1].trim();
                data.nachname = name[0].trim();
                console.log(`retry successful!`)

            } catch (exception) {
                console.log(`non-conforming data "${row.Kunde}" is not salvageable. Skipping...`);
            }
        }

        // extract strasse, plz, ort, land from Anschrift
        try {
            let adressdaten = row.Anschrift.replace(/\#[0-9]+\#/g, "").trim().match(/(.{3,}) ([0-9]{3,5}) (.+)/m);
            console.log(adressdaten);
            if (adressdaten != null && adressdaten.length == 4) {
                data.strasse = adressdaten[1];
                data.plz = adressdaten[2];
                data.ort = adressdaten[3];
                data.land = data.plz.length == 5 ? "Deutschland" : data.plz.length == 4 ? "Niederlande" : "";
            }
        } catch (exception) {
            console.log(`non-conforming data in column Anschrift: "${row.Anschrift}". Skipping...`);
            console.error(exception);
        }

        // extract apartment from Name_der_gebuchten_Leistung
        try {
            data.apartment = row.Name_der_gebuchten_Leistung.match(/(.+?Apartment)/gm)[0];
        } catch (exception) {
            console.log(`non-conforming data in column Name_der_gebuchten_Leistung: "${row.Anschrift}". Skipping...`);
        }

        // insert row
        DB.insert(SEARCH_TABLE, data);
        DB.commit();
    });

    console.log(DB.queryAll(SEARCH_TABLE));
}

document.getElementById('upload').addEventListener('change', handleFile, false);