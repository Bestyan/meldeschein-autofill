// for webpack (css needs to be referenced to be packed)
import "../css/popup.css";

import XLSX from 'xlsx';
import localStorageDB from 'localstoragedb';
import Tabulator from 'tabulator-tables';

const STATUS_DATE_FORMAT = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
};

const SEARCH_RESULT_DATE_FORMAT = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
};

const DB = new localStorageDB("meldeschein", sessionStorage);
const TABLE_RAW = "raw_data";
const TABLE_SEARCH = "clean_data";
// columns of the RAW table
const COLUMNS_RAW = [];
// columns of the SEARCH table
const COLUMNS_SEARCH = ["vorname", "nachname", "anschrift", "strasse", "plz", "ort", "land", "anreise", "abreise", "apartment", "personen", "vermerk", "email"];
// dropdowns in popup
const COLUMNS_FILTER = ["anreise", "apartment", "vorname", "nachname", "abreise"]

let can_search = false;
const SESSIONSTORAGE_LAST_UPLOAD = "last_upload";
let last_upload = window.sessionStorage.getItem(SESSIONSTORAGE_LAST_UPLOAD);

let result_table = null;

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
            COLUMNS_RAW.push(cell.w);
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
    if (DB.tableExists(TABLE_RAW)) {
        DB.dropTable(TABLE_RAW);
    }
    DB.createTableWithData(TABLE_RAW, rows);

    if (DB.tableExists(TABLE_SEARCH)) {
        DB.dropTable(TABLE_SEARCH);
    }
    DB.createTable(TABLE_SEARCH, COLUMNS_SEARCH);

    /*
        reformat column Kunde to Vorname, Nachname
    */
    let raw_rows = DB.queryAll(TABLE_RAW);
    raw_rows.forEach(row => {
        let data = {
            vorname: "",
            nachname: "",
            anschrift: row.Anschrift,
            strasse: "",
            plz: "",
            ort: "",
            land: "",
            anreise: row.Anreise.toLocaleDateString("de-DE", SEARCH_RESULT_DATE_FORMAT),
            abreise: row.Abreise.toLocaleDateString("de-DE", SEARCH_RESULT_DATE_FORMAT),
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
        DB.insert(TABLE_SEARCH, data);
        DB.commit();

        last_upload = new Date().toLocaleDateString('de-DE', STATUS_DATE_FORMAT);
        window.sessionStorage.setItem(SESSIONSTORAGE_LAST_UPLOAD, last_upload);
        refreshStatus();
    });

    console.log(DB.queryAll(TABLE_SEARCH));
}

function refreshStatus() {
    const NO_DATA = "no data";
    let status = document.getElementById("status");
    status.classList.remove("good");
    status.classList.remove("bad");

    if (!DB.tableExists(TABLE_SEARCH)) {
        can_search = false;
        status.classList.add("bad");
        status.innerHTML = NO_DATA;
        return;
    }

    if (DB.queryAll(TABLE_SEARCH).length === 0) {
        can_search = false;
        status.classList.add("bad");
        status.innerHTML = NO_DATA;
        return;
    }

    can_search = true;
    status.classList.add("good");
    status.innerHTML = `Daten vom ${last_upload}`;
    return;
}

function populateSearchDropDowns() {
    let dropdowns = [
        document.getElementById("search1"),
        document.getElementById("search2"),
        document.getElementById("search3")
    ];

    dropdowns.forEach(dropdown => {
        COLUMNS_FILTER.forEach(column => {
            let option = document.createElement("option");
            option.value = column;
            option.innerHTML = column;
            dropdown.append(option);
        });
    });

    dropdowns[1].value = "nachname";
    dropdowns[2].value = "apartment";

    document.getElementById("search1_input").value = new Date().toLocaleDateString("de-DE", SEARCH_RESULT_DATE_FORMAT);
}

function search(event) {
    event.preventDefault();
    let searchParams = {};

    let search1 = document.getElementById("search1_input").value;
    if (search1.length > 0) {
        searchParams[document.getElementById("search1").value] = search1;
    }

    let search2 = document.getElementById("search2_input").value;
    if (search2.length > 0) {
        searchParams[document.getElementById("search2").value] = search2;
    }

    let search3 = document.getElementById("search3_input").value;
    if (search3.length > 0) {
        searchParams[document.getElementById("search3").value] = search3;
    }

    console.log(searchParams);

    // query DB
    let rows = [];
    if (searchParams.length === 0) {
        rows = DB.queryAll(TABLE_SEARCH);
    } else {
        rows = DB.queryAll(TABLE_SEARCH, {
            query: row => {
                for (const [key, value] of Object.entries(searchParams)) {
                    if (!(row[key] + "").includes(value)) {
                        return false;
                    }
                }
                return true;
            }
        })
    }

    console.log(rows);
    result_table = new Tabulator("#search_results", {
        layout: "fitDataStretch",
        data: rows,
        selectableRollingSelection: true,
        selectable: 1,
        pagination: "local",
        paginationSize: 10,
        columns: [{
                title: "Vorname",
                field: "vorname"
            },
            {
                title: "Nachname",
                field: "nachname"
            },
            {
                title: "Anreise",
                field: "anreise"
            },
            {
                title: "Abreise",
                field: "abreise"
            },
            {
                title: "Apartment",
                field: "apartment"
            },
            {
                title: "Personen",
                field: "personen"
            },
            {
                title: "Vermerk",
                field: "vermerk"
            }
        ]
    });
}

refreshStatus();
document.getElementById('upload').addEventListener('change', handleFile, false);
document.getElementById('search').addEventListener('submit', search);
populateSearchDropDowns();

document.getElementById('fill').addEventListener("click", event => {
    let data = result_table.getSelectedData()[0];
    console.log(data);
    let form_data = {
        "anreise_input": data.anreise,
        "abreise_input": data.abreise,
        "nachname0": data.nachname, //Nachname Gast
        "nachname1_input": data.nachname, // Nachname Begl. 1
        "vorname0": data.vorname,
        "strasse0": data.strasse || data.anschrift,
        "plz0_input": data.plz,
        "ort0": data.ort,
        "email": data.email
    };

    if (data.land !== "") {
        form_data["land0_input"] = data.land; // Land in Adresse (vorausgefüllt Deutschland)
        form_data["staat0_input"] = data.land; // Staatsangehörigkeit Gast
        form_data["staat1_input"] = data.land; // Staatsangehörigkeit Begl. 1
    }


    let stringified_data = JSON.stringify(form_data);
    /*
        really, really dirty, but it might just work on that wonky website
    */
    chrome.tabs.executeScript(null, {
        code: `
        for (const [key, value] of Object.entries(${stringified_data})) {
            document.getElementById(key).value = value;
        }
    `
    });
});