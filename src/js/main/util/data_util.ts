import { Booking, ValidationError } from "../database/guest_excel";
import constants from "./constants";
import { Buffer } from "buffer";

const regionNamesToFull = new Intl.DisplayNames(['de'], { type: 'region' });

interface DeferredPromise {
    promise: Promise<any>,
    resolve: (value: any) => void
}

const utils = {
    generateDeferredPromise(): DeferredPromise {
        return (() => {
            let resolve;

            const promise = new Promise(resolvePromise => {
                resolve = resolvePromise;
            });

            return {
                promise: promise,
                resolve
            };
        })();
    },
    /**
     * 
     * @param {string} birthdate 
     * @param {string} date day of the age check
     * @returns {number} age
     */
    getAgeOnDate(birthdate: Date, date: Date): number {
        try {
            // if birthdate was 01.01.1970 then date would be ...?
            const ageDate = new Date(date.getTime() - birthdate.getTime());
            // get age by counting the years since 1970
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
    },
    /**
     * @returns dd.MM.yyyy
     */
    formatDate(date: Date): string {
        return date.toLocaleDateString("de-DE", constants.dateFormat.dateWithLeadingZeroes.format);
    },
}


export default {

    getHotspotName: (apartment: string): string => {
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
        return null;
    },

    getVoucherDuration: (abreise: Date): string => {
        const lengthOfStay: number = Math.ceil((abreise.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) + 1; // abreise - heute + 1

        if (lengthOfStay < 0) {
            alert(`Abreise ${utils.formatDate(abreise)} liegt in der Vergangenheit!`);
            return null;
        }

        let daysValid = 7;

        if (lengthOfStay <= 7) {
            daysValid = 7;
        } else if (lengthOfStay <= 10) {
            daysValid = 10;
        } else if (lengthOfStay <= 14) {
            daysValid = 14;
        } else if (lengthOfStay <= 16) {
            daysValid = 16;
        } else if (lengthOfStay <= 22) {
            daysValid = 22;
        } else {
            daysValid = 40;
        }

        return `${daysValid} Tage`;
    },

    getVoucherComment: (booking: Booking) => {
        return `${booking.organiserLastname} ${booking.apartment} ${utils.formatDate(booking.arrival)} bis ${utils.formatDate(booking.departure)}`;
    },

    /**
     * 
     * @param {Array<Date>} birthdates 
     * @param {Date} anreise 
     * @returns 
     */
    getNumberOfKeys: (birthdates: Array<Date> | null, anreise: Date): number => {
        if (!birthdates || birthdates.length === 0) {
            return 2;
        }

        let numberOfKeys = 0;
        birthdates.forEach(birthdate => {
            const age = utils.getAgeOnDate(birthdate, anreise);
            if (age >= 16) {
                numberOfKeys++;
            }
        });

        // enforce 2 key minimum
        if (numberOfKeys < 2) {
            return 2;
        }

        return numberOfKeys;
    },

    formatDate: utils.formatDate,

    clone(object: any): any {
        return JSON.parse(JSON.stringify(object));
    },

    readTextFile(file: Blob): Promise<string> {
        const reader = new FileReader()
        return new Promise((resolve, reject) => {
            reader.onload = event => resolve(event.target.result as string)
            reader.onerror = error => reject(error)
            reader.readAsText(file, "UTF-8")
        })
    },

    tryCountryCode(countryCode: string): string {
        countryCode = countryCode || "";
        try {
            return regionNamesToFull.of(countryCode.toUpperCase());
        } catch (error) {
            return countryCode;
        }
    },

    formatValidationErrors(validationErrors: Array<ValidationError>): string {
        return validationErrors
            .map(validationError => ValidationError.toMessage(validationError))
            .reduce((total: string, errorString: string) => total + "\n" + errorString);
    },

    getStringBetween(input: string, start: string, end: string): string {
        if (!input.includes(start) || !input.includes(end)) {
            throw "data_util.getStringBetween: input does not include start or end string";
        }

        return input.split(start)[1].split(end)[0];
    },

    replacePlaceholders(input: string, placeholderValues: Object): string {
        Object.entries(placeholderValues).forEach(entry => {
            const [key, value] = entry;
            input = input.replaceAll(`{{ ${key} }}`, value);
        });
        return input;
    },

    base64Encode(input: string): string {
        return Buffer.from(input).toString("base64");
    },

    parseDateCell(cellValue: Object | string): Date | null {
        // due to some Excel shenanigans, not all Date cells actually provide dates, but sometimes strings
        if (typeof cellValue === "object") {
            return cellValue as Date;
        }
        if (typeof cellValue === "string") {
            const parts = cellValue.trim().split(".");
            // convert to UTC string since that is the only bulletproof approach
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
        }
        return null;
    }
};