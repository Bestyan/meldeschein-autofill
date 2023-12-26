import constants from "./constants";

const utils = {
    /**
     * split a name text into a first name and a last name
     * text is either "firstname lastname" or "lastname, firstname"
     */
    getNameParts(name) {
        let firstname, lastname;
        if (name.includes(",")) {
            lastname = name.substring(0, name.indexOf(",")).trim();
            firstname = name.substring(name.indexOf(",") + 1, name.length).trim();
        } else {
            firstname = name.substring(0, name.indexOf(" ")).trim();
            lastname = name.substring(name.indexOf(" ") + 1, name.length).trim();
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
                month = parts[1],
                year = parts[2];

            // month is weird in the Date format: 0 -> January, 1 -> February etc
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
        // keine vorangestellte zahl, 1-2 Zahlen, Punkt oder Minus, 1-2 Zahlen, Punkt, 2 oder 4 Zahlen, keine nachgestellte Zahl
        const regexDate = /((?<!\d)\d{1,2}[.-]\d{1,2}[.-]\d{2}(?:\d{2})?(?!\d))/g;
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

        dates = dates.map(dateString => {
            // the date regex allows "-" as well as "." as a separator
            // for all further steps, only . is allowed
            dateString = dateString.split("-").join(".");

            // convert two-digit years into 4 digit ones
            // if number > current year digits, e.g. 89 > 20 => 1989
            // if number <= current year digits, e.g. 04 < 20 => 2004
            let parts = dateString.split(".");
            let year = parts[2];

            if (year.length == 2) {
                const currentYearOnes = new Date().getFullYear() % 100;
                const currentYearHundreds = Math.floor(new Date().getFullYear() / 100);
                year = +year > currentYearOnes ? (currentYearHundreds - 1) * 100 + (+year) : currentYearHundreds * 100 + (+year);
                parts[2] = year;
            }
            dateString = parts.join(".");
            return dateString;
        });



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
    },

    /**
     * 
     * @param {string} dateText 
     * @returns 
     */
    parseDate(dateText) {
        const parts = dateText.match(/(\d+)/g);
        return new Date(parts[2], parts[1] - 1, parts[0]);
    },

    addDays(date, days) {
        const newDate = new Date(date.valueOf());
        newDate.setDate(newDate.getDate() + days);
        return newDate;
    },

    /**
     * 
     * @param {string} birthdate 
     * @param {string} date day of the age check
     * @returns {number} age
     */
    getAgeOnDate(birthdate, date) {
        try {
            const ageDate = new Date(utils.parseDate(date) - utils.parseDate(birthdate));
            const age = Math.abs(ageDate.getUTCFullYear() - 1970);
            return age;
        } catch (error) {
            console.log(`getAgeOnDate("${birthdate}", "${date}") threw an exception`);
            console.log(error.toString());
            alert(`Geburtsdatum oder Tag der Anreise sind ungültig.
Geburtsdatum: ${birthdate}
Anreise: ${date}`);
            return -1;
        }
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
            land: "",
            rabatt: 0
        };

        // extract rebate (if there is one, the field anschrift starts with it e.g. #15#herecomestheadress)
        if (anschrift.startsWith("#")) {
            // extract the part between the first two hashtags
            const rebateString = anschrift.substring(1, anschrift.slice(1).indexOf("#") + 1);
            // replace commas with points and convert to number
            const rebate = +rebateString.replace(",", ".");
            result.rabatt = rebate;
        }

        try {
            // remove rebate patterns like #15# from the start
            const anschriftTrimmed = anschrift.replace(/\#\d+\,?\d*\#/g, "").trim();

            // match '3+letters 4-5numbers 1+letters'
            let adressdaten = anschriftTrimmed.match(/(.{3,}) (\d{4,5}) (.+)/m);
            console.log(adressdaten);
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
     * converts the textarea input into a list of person objects, each with a name and birthdate attribute
     * @param {string} text birthdate textarea input
     * @returns {Array<{name: string, birthdate: string}>}
     */
    getNamesAndBirthdates: (text) => {
        const parsed = utils.parseText(text);
        if (parsed == null) {
            return null;
        }

        const { names, dates } = parsed;
        const namesAndBirthdates = [];
        try {
            for (let i = 0; i < names.length; i++) {
                const element = {
                    name: names[i],
                    birthdate: dates[i]
                };
                namesAndBirthdates.push(element);
            }
        } catch (error) {
            console.log(error.toString());
            console.log(JSON.stringify(names));
            console.log(JSON.stringify(birthdates));
            alert("Anzahl an Namen und Geburtsdaten ist nicht gleich");
            return [];
        }

        return namesAndBirthdates;
    },

    /**
     * 
     * @param {Array<{name: string, birthdate: string}>} namesAndBirthdates 
     * @param {string} anreise 
     * @returns 
     */
    getNumberOfKeys: (namesAndBirthdates, anreise) => {
        if (!namesAndBirthdates || namesAndBirthdates.length === 0) {
            return 2;
        }

        let numberOfKeys = 0;
        namesAndBirthdates.forEach(({ birthdate }) => {
            const age = utils.getAgeOnDate(birthdate, anreise);
            if (age >= 16) {
                numberOfKeys++;
            }
        });

        // enforce 2 key minimum
        if (numberOfKeys < 2) {
            numberOfKeys = 2;
        }

        return numberOfKeys;
    },

    /**
     * creates a map of covid testdates, keys are testdatum2 to testdatum7. each date is set 3 days apart
     * @param {string} anreise 
     * @param {string} abreise 
     */
    getCovidTestDates: (anreise, abreise) => {
        const anreiseDate = utils.parseDate(anreise);
        const abreiseDate = utils.parseDate(abreise);
        const testDates = {};
        const daysBetweenTests = 3;
        // dd.mm.yyyy
        const dateFormat = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };

        let lastTestDate = anreiseDate;
        for (let i = 2; i <= 7; i++) {
            // add 3 days to the last testDate
            const testDate = utils.addDays(lastTestDate, daysBetweenTests);
            if (testDate >= abreiseDate) {
                break;
            }
            // format to dd.mm.yyyy
            testDates[`testdatum${i}`] = testDate.toLocaleDateString("de-DE", dateFormat);

            lastTestDate = testDate;
        }

        return testDates;
    },

    /**
     * names for the covid test date paper. if a child is younger than 6, they are exempt
     * @param {Array<{name: string, birthdate: string}>} namesAndBirthdates 
     * @param {string} anreise 
     * @param {string} abreise 
     */
    getCovidTestNames: (namesAndBirthdates, anreise, abreise) => {
        const testNames = {};
        for (let i = 0; i < namesAndBirthdates.length; i++) {
            let { name, birthdate } = namesAndBirthdates[i];
            const ageOnArrival = utils.getAgeOnDate(birthdate, anreise);
            const ageOnDeparture = utils.getAgeOnDate(birthdate, abreise);

            // add age to the name if child is exempt bc its younger than 6
            if (ageOnDeparture === 6 && ageOnArrival === 5) {
                name += " (5 Jahre, wird 6)";
            } else if (ageOnArrival < 6) {
                name += ` (${ageOnArrival} Jahre)`;
            }

            testNames[`nameTestpflicht${i + 1}`] = name;
        }
        return testNames;
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

        let originalBooker = {
            firstname: data.vorname.trim(),
            lastname: data.nachname.trim()
        };

        const result = {};
        const birthdate_fields = JSON.parse(JSON.stringify(constants.BIRTHDATE_FIELDS));
        const firstname_fields = JSON.parse(JSON.stringify(constants.FIRSTNAME_FIELDS));

        // for the person who is already filled in because they were in the xls as the one who booked it
        // since they are not necessarily the oldest person, they need to have a special case
        // if there is no matching name, the closest person found will overwrite it
        // if no close match is found, the oldest person will overwrite it
        const birthdate_field_guest = birthdate_fields.shift();
        const firstname_field_guest = firstname_fields.shift();
        const lastname_field_guest = constants.LASTNAME_FIELDS[0];

        let originalBookerFound = false;
        namesSorted.forEach(name => {
            const {
                firstname,
                lastname
            } = utils.getNameParts(name);

            // if firstname and lastname match, the original booker's name is in the list
            if (firstname === originalBooker.firstname && lastname === originalBooker.lastname) {
                originalBookerFound = true;
            }
        });

        // if no match is found, try to find the closest equivalent
        let equivalentFound = false;
        if (!originalBookerFound) {
            namesSorted.forEach(name => {
                const {
                    firstname,
                    lastname
                } = utils.getNameParts(name);

                // assume last name is still the same, but first name may have a longer version
                if (originalBooker.lastname === lastname &&
                    originalBooker.firstname.includes(firstname)) {
                    // adjust first name
                    originalBooker.firstname = firstname;
                    equivalentFound = true;
                }
            });
        }

        // if no equivalent is found, the oldest person will overwrite it
        if (!equivalentFound) {
            const {
                firstname,
                lastname
            } = utils.getNameParts(namesSorted[0]);
            originalBooker.firstname = firstname;
            originalBooker.lastname = lastname;
        }

        // set all the name and birthdate fields
        for (let i = 0; i < namesSorted.length; i++) {
            const name = namesSorted[i];
            const date = datesSorted[i];
            const {
                firstname,
                lastname
            } = utils.getNameParts(name);

            // the original booker has special fields and is not necessarily the first in the list
            if (firstname === originalBooker.firstname &&
                lastname === originalBooker.lastname) {
                // set birth date with blur event (will be executed by content script)
                result[birthdate_field_guest] = {
                    value: date,
                    event: "blur"
                };
                result[firstname_field_guest] = firstname;
                result[lastname_field_guest] = lastname;
            } else {
                // standard case: set both firstname field and birthdate field

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
    },

    /**
     * string parameters are in the european date format [d]d.[m]m.yyyy
     * @param {string} startDateString 
     * @param {string} endDateString 
     * @returns 
     */
    getNumberOfNights: (startDateString, endDateString) => {
        const start = utils.parseDate(startDateString);
        const end = utils.parseDate(endDateString);
        const timeDiff = Math.abs(end.getTime() - start.getTime());
        const numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return numberOfNights;
    },

    getAgeOnDate: utils.getAgeOnDate,

    /**
     * creates an Array of season Objects based on today's date
     * @returns {Array<{value: Number, text: String, selected: Boolean}>}
     */
    getSeasons: () => {
        const today = new Date();
        /**
         * seasons last from 1st of may to 30th of april  
         * currentSeason denotes the year of the seasons start, e.g. season 2020/2021 is denoted by currentSeason = 2020
         */
        let currentSeasonValue;
        // 1st of May - remember, in the Date format, month = 0 means January, therefore month = 4 is May
        const thisYearsSeasonStart = new Date(today.getFullYear(), 4, 1);

        if (today > thisYearsSeasonStart){
            // if we're past 1st of May this year, today's year is the season's starting year
            currentSeasonValue = today.getFullYear();
        } else{
            // if we're not past the 1st of May, the current season started last year
            currentSeasonValue = today.getFullYear() - 1;
        }

        const currentSeasonText = `Saison ${currentSeasonValue}/${currentSeasonValue + 1}`;
        const currentSeason = {
            value: currentSeasonValue,
            text: currentSeasonText,
            selected: true
        };

        const lastSeasonValue = currentSeasonValue - 1;
        const lastSeasonText = `Saison ${lastSeasonValue}/${lastSeasonValue + 1}`;
        const lastSeason = {
            value: lastSeasonValue,
            text: lastSeasonText,
            selected: false
        };

        const nextSeasonValue = currentSeasonValue + 1;
        const nextSeasonText = `Saison ${nextSeasonValue}/${nextSeasonValue + 1}`;
        const nextSeason = {
            value: nextSeasonValue,
            text: nextSeasonText,
            selected: false
        };

        // return array in chronological order
        return [lastSeason, currentSeason, nextSeason];
    }
};