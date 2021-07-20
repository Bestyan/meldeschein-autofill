import constants from "./constants";

const utils = {
    /**
     * split a name text into a first name and a last name
     * text is either "firstname lastname" or "lastname, firstname"
     */
    getNameParts(name) {
        let firstname, lastname;
        if (name.includes(",")) {
            firstname = name.substring(0, name.indexOf(",")).trim();
            lastname = name.substring(name.indexOf(","), name.length).trim();
        } else {
            firstname = name.substring(0, name.lastIndexOf(" ")).trim();
            lastname = name.substring(name.lastIndexOf(" "), name.length).trim();
        }
        return {
            firstname: firstname,
            lastname: lastname
        };
    },

    sortDatesAscending(dates) {
        return dates.sort((a, b) => {
            return a - b;
        });
    },

    /**
     * sort two arrays, one containing dates, the other containing names by the dates while keeping the names at the same index as their corresponding date
     */
    sortNamesAndDates(dates, names) {
        // sort both arrays ascending by their dates so the oldest people come first
        const dateObjects = dates.map(dateString => {
            const parts = dateString.split(".");
            const day = parts[0],
                month = parts[1];
            let year = parts[2];

            // converts two-digit years into 4 digit ones
            // if number > current year digits, e.g. 89 > 20 => 1989
            // if number <= current year digits, e.g. 04 > 20 => 2004
            if (year.length == 2) {
                const currentYearOnes = new Date().getFullYear() % 100;
                const currentYearHundreds = Math.floor(new Date().getFullYear() / 100);
                year = year > currentYearOnes ? (currentYearHundreds - 1) * 100 + (+year) : currentYearHundreds * 100 + (+year);
            }
            return new Date(year, month - 1, day);
        });

        // create a map {"John Doe" : "<dateIsoString>"}
        const mapNamesToDates = names.reduce((map, _, index) => {
            map[_] = dateObjects[index].toString();
            return map;
        }, {});

        // sort dates
        this.sortDatesAscending(dateObjects);

        // create name array sorted by date
        const namesSorted = dateObjects.map(date => {
            let toBeRemoved;
            for (const [name, dateString] of Object.entries(mapNamesToDates)) {
                if (dateString === date.toString()) {
                    toBeRemoved = name;
                    break;
                }
            }
            delete mapNamesToDates[toBeRemoved];
            return toBeRemoved;
        });

        // create sorted date array
        const datesSorted = dateObjects.map(date => date.toLocaleDateString("de-DE", constants.BIRTHDAY_DATE_FORMAT));
        return {
            namesSorted: namesSorted,
            datesSorted: datesSorted
        };
    },

    /**
     * parse Text from email into an array of names and array of birthdates
     */
    parseText(text) {
        // keine vorangestellte zahl, 1-2 Zahlen, Punkt, 1-2 Zahlen, Punkt, 2 oder 4 Zahlen, keine nachgestellte Zahl
        const regexDate = /((?<!\d)\d{1,2}[.]\d{1,2}[.]\d{2}(?:\d{2})?(?!\d))/g;
        // 2+ Zeichen (keine Zahl/Whitespace), Leerzeichen, 2+ Zeichen (keine Zahl/Whitespace)
        const regexName = /\p{Lu}((?=[^\d]).)+ \p{Lu}((?=[^\d])(?=[^,.])\S)+/ug;
        // 2+ Zeichen (keine Zahl/Whitespace), Leerzeichen (optional), Komma, Leerzeichen (optional), 2+ Zeichen (keine Zahl/Whitespace)
        const regexName2 = /\p{Lu}((?=[^\d]).)+ ?, ?\p{Lu}((?=[^\d])(?=[^,.])\S)+/ug;

        // preparing the text by removing unnecessary stuff
        text = text.toString()
            .split("\n").join(" ")
            .split("\r").join(" ")
            .split("Dr.").join("")
            .split(", geboren").join("")
            .split(" geboren").join("")
            .split("*").join("")
            .split(" am").join("")
            .split(", geb.").join("")
            .split(" geb.").join("")
            .split(" geb").join("");

        let dates = text.match(regexDate);
        let names = text.match(regexName);

        if (!dates || dates.length === 0) {
            console.log(`could not find any dates in text: "${text}"`)
            return null;
        }

        if (!names || names.length === 0) {
            names = text.match(regexName2);
            if (!names || names.length === 0) {
                console.log(`could not find any names in text: "${text}"`)
                return null;
            }
        }

        if (dates.length !== names.length) {
            console.log(`number of dates (${JSON.stringify(dates)}) does not match the number of names (${JSON.stringify(names)})`)
            return null;
        }

        return {
            dates: dates,
            names: names
        };
    },

    generateDeferredPromise() {
        return (() => {
            let resolve;

            const p = new Promise(res => {
                resolve = res;
            });

            return {
                promise: p,
                resolve
            };
        })();
    }
}


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
                .replace(/\#\d+\#/g, "") // remove rebate patterns like #15# from the start
                .trim()
                .match(/(.{3,}) (\d{4,5}) (.+)/m); // match '3+letters 4-5numbers 1+letters'
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
        if (apartment.includes("Enzian") ||
            apartment.includes("Krokus")) {
            return "12 Enzian";
        }
        if (apartment.includes("Lavendel") ||
            apartment.includes("Lilien")) {
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
    },

    /**
     * 
     * @param {*} text birthdate textarea input
     * @returns array of names
     */
    getNames: (text) => {
        const parsed = utils.parseText(text);
        if (parsed == null) {
            return null;
        }

        return parsed.names;
    },

    /**
     * fill birthdates in a form that has already been partially filled
     */
    getBirthdatesForMeldeschein: (text, data) => {

        const parsed = utils.parseText(text);
        if (parsed == null) {
            return null;
        }

        const {
            dates,
            names
        } = parsed;

        const {
            namesSorted,
            datesSorted
        } = utils.sortNamesAndDates(dates, names);

        const result = {};
        const birthdate_fields = JSON.parse(JSON.stringify(constants.BIRTHDATE_FIELDS));
        const firstname_fields = JSON.parse(JSON.stringify(constants.FIRSTNAME_FIELDS));

        // for the person who is already filled in because they were in the xls as the one who booked it
        // since they are not necessarily the oldest person, they need to have a special case
        const birthdate_field_guest = birthdate_fields.shift();
        firstname_fields.shift();

        for (let i = 0; i < namesSorted.length; i++) {
            const name = namesSorted[i];
            const date = datesSorted[i];
            const {
                firstname,
                lastname
            } = utils.getNameParts(name);

            if (firstname.trim() === data.vorname.trim()) {
                // special case for the person who booked it
                result[birthdate_field_guest] = {
                    value: date,
                    event: "blur"
                };
            } else {
                // set birthdate field value and blur event (will be executed by content script)
                const birthdate_field = birthdate_fields.shift();
                result[birthdate_field] = {
                    value: date,
                    event: "blur"
                };
                // set firstname
                result[firstname_fields.shift()] = firstname;

                // if it's the Begl1 field, also set the last name (it might differ)
                if (birthdate_field === constants.FIELDS_BEGL1.birthdate) {
                    result[constants.FIELDS_BEGL1.lastname] = lastname;
                }
            }
        }
        return result;
    },

    /**
     * fill birthdates and names in an empty form
     */
    getDataForNewMeldeschein: (text, getGender) => {
        return new Promise((resolve, reject) => {
            const parsed = utils.parseText(text);
            if (parsed == null) {
                reject("could not parse text");
            }

            const {
                dates,
                names
            } = parsed;

            const {
                namesSorted,
                datesSorted
            } = utils.sortNamesAndDates(dates, names);

            console.log("names sorted: " + namesSorted.toString());
            console.log("dates sorted: " + datesSorted.toString());

            const result = {};
            const birthdate_fields = JSON.parse(JSON.stringify(constants.BIRTHDATE_FIELDS));
            const firstname_fields = JSON.parse(JSON.stringify(constants.FIRSTNAME_FIELDS));
            const lastname_fields = JSON.parse(JSON.stringify(constants.LASTNAME_FIELDS));

            const hasCompanion = namesSorted.length >= 2;
            const deferredPromises = [];
            if (hasCompanion) {
                for (let i = 0; i < 2; i++) {
                    deferredPromises.push(utils.generateDeferredPromise());
                }
            }

            for (let i = 0; i < namesSorted.length; i++) {
                const name = namesSorted[i];
                const date = datesSorted[i];
                const {
                    firstname,
                    lastname
                } = utils.getNameParts(name);


                // set birthdate field value and blur event (will be executed by content script)
                result[birthdate_fields.shift()] = {
                    value: date,
                    event: "blur"
                };
                // set firstname
                result[firstname_fields.shift()] = firstname;

                // for first 2 person, the title and lastname fields also needs to be filled
                if (i < 2) {
                    result[lastname_fields.shift()] = lastname;
                    getGender(firstname)
                        .then(gender => {
                            result[constants.ANREDE_FIELDS[i]] = constants.getAnrede(gender);
                        })
                        .catch(error => {
                            console.log(error);
                            result[constants.ANREDE_FIELDS[i]] = constants.ANREDE_GAST;
                        })
                        .finally(() => deferredPromises[i].resolve());
                }
            }
            Promise.all(Object.values(deferredPromises).map(deferred => deferred.promise))
                .then(() => resolve(result))
                .catch(error => reject(error));
        });
    },

    /**
     * resets everything except Anreise/Abreise
     */
    getClearFormData() {
        return {
            nachname0: "", //Nachname Gast
            vorname0: "",
            geburtsdatum0_input: "",
            klasse0: -1,
            anrede0: constants.ANREDE_HERR,
            staat0_input: "Deutschland",

            strasse0: "",
            land0_input: "Deutschland",
            plz0_input: "",
            ort0_input: "",

            nachname1_input: "", // Nachname Begl. 1
            vorname1: "",
            geburtsdatum1_input: "",
            klasse1: -1,
            anrede1: constants.ANREDE_HERR,
            staat1_input: "Deutschland",


            vorname2: "",
            geburtsdatum2_input: "",
            klasse2: -1,

            vorname3: "",
            geburtsdatum3_input: "",
            klasse3: -1,

            vorname4: "",
            geburtsdatum4_input: "",
            klasse4: -1,

            vorname5: "",
            geburtsdatum5_input: "",
            klasse5: -1,

            email: ""
        };
    },

    getLocationForForm(responseData) {
        const {
            status,
            error,
            data
        } = responseData;

        if (status !== 'ok') {
            console.log(error);
            return null;
        }

        const {
            country,
            city,
            state,
            zipcode,
            streetName,
            streetNumber
        } = data;

        return {
            strasse0: `${streetName} ${streetNumber}`,
            land0_input: country,
            plz0_input: zipcode,
            ort0_input: city,
            staat0_input: country,
            staat1_input: country
        };
    },

    cleanLocationText(text) {
        return text.toString()
            .split("\n").join(" ")
            .split("\r").join(" ")
            .replace(/(?<=\d) (?=\p{L} )/gu, "") // removes space between streetnumber and letter e.g. 16 a => 16a
            .replace(/(?<=(?<!\d)\d{4}) (?=\p{Lu}{2}(?!\p{L}))/gu, "") // removes space between 4-digit postal code and 2 uppercase letter area code e.g. 1071 JL => 1071JL
            .split("wohnhaft in").join("")
            .split("wohnhaft").join("")
            .split("wohnt in").join("")
            .split("wohnt").join("")
            .split("lebt in").join("")
            .split("Adresse:").join("")
            .split("Wohnort:").join("")
            .split("ansässig in").join("");
    }
};