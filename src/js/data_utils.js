export default {

    cleanColumnNames: sheet => {
        for (let i = 65; i < 100; i++) {
            let cell = sheet[`${String.fromCharCode(i)}1`]; // A1, B1, C1, ...
            if (typeof cell === 'undefined') {
                break;
            }
            cell.w = cell.w.replace(/ä/g, "ae")
                .replace(/ö/g, "oe")
                .replace(/ü/g, "ue")
                .replace(/ß/g, "ss")
                .replace(/ẞ/g, "ss")
                .replace(/[ \/]/g, "_")
                .replace(/#/g, "Nr");
        }
    },

    processKunde: kunde => {
        const processed = {
            vorname: "",
            nachname: ""
        };
        let success = false;
        for (const delimiter of [",", " "]) {
            if (delimiter === " ") console.log(`non-conforming data in column Kunde: "${kunde}". Retrying...`);
            let name = kunde.split(delimiter);
            if (name.length >= 2) {
                processed.vorname = name[1].trim();
                processed.nachname = name[0].trim();
                success = true;
                break;
            }
        }
        if (!success) console.log(`non-conforming data "${kunde}" is not salvageable. Skipping...`);
        return processed;
    },

    processAnschrift: anschrift => {
        const result = {
            strasse: "",
            plz: "",
            ort: "",
            land: ""
        };

        try {
            let adressdaten = anschrift
                .replace(/\#[0-9]+\#/g, "") // remove rebate patterns like #15# from the start
                .trim()
                .match(/(.{3,}) ([0-9]{4,5}) (.+)/m); // match '3+letters 4-5numbers 1+letters'
            if (adressdaten != null && adressdaten.length == 4) {
                result.strasse = adressdaten[1];
                result.plz = adressdaten[2];
                result.ort = adressdaten[3];
                // 5-stellige PLZ => DE
                // 4-stellige PLZ => NL
                result.land = result.plz.length == 5 ? "Deutschland" : result.plz.length == 4 ? "Niederlande" : ""
            }
            return result;
        } catch (exception) {
            console.log(`non-conforming data in column Anschrift: "${row.Anschrift}". Skipping...`);
            console.log(exception);

            return result;
        }
    },

    processApartment: apartment => {
        try {
            const matches = apartment.match(/(.+?)-Apartment/);
            return matches[1];
        } catch (exception) {
            console.log(`non-conforming data in column Name_der_gebuchten_Leistung: "${row.Name_der_gebuchten_Leistung}". Skipping...`);
            return "";
        }
    },

    getHotspot: apartment => {
        if (apartment.includes("Krokus") ||
            apartment.includes("Lilien")) {
            return "02-14-21 Fruehling";
        }
        if (apartment.includes("Enzian")) {
            return "12 Enzian";
        }
        if (apartment.includes("Lavendel")) {
            return "22 Lavendel";
        }
        if (apartment.includes("Rosen")) {
            return "23 Rosen";
        }
        if (apartment.includes("Tulpen")) {
            return "24 Tulpen";
        }
        if (apartment.includes("Nelken")) {
            return "31 Nelken";
        }
        if (apartment.includes("Narzissen")) {
            return "32 Narzissen";
        }
    },

    getVoucherGueltigkeit: abreise => {
        const abreiseParts = abreise.split(".");
        const baseLength = Math.ceil((new Date(abreiseParts[2], abreiseParts[1] - 1, abreiseParts[0]) - new Date()) / (1000 * 60 * 60 * 24)) + 1; // abreise - heute + 1

        if (baseLength < 0) {
            alert("ungültiges Abreisedatum");
            return null;
        }

        let gueltigkeit = 7;

        if (baseLength <= 7) {
            gueltigkeit = 7;
        } else if (baseLength <= 10) {
            gueltigkeit = 10;
        } else if (baseLength <= 14) {
            gueltigkeit = 14;
        } else if (baseLength <= 16) {
            gueltigkeit = 16;
        } else {
            gueltigkeit = 22;
        }

        return `${gueltigkeit} Tage`;
    },

    getKommentar: table_data => {
        return `${table_data.nachname} ${table_data.apartment} ${table_data.anreise} bis ${table_data.abreise}`;
    }
};