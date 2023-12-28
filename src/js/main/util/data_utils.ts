import constants from "./constants";

interface DeferredPromise { 
    promise: Promise<any>, 
    resolve: (value: any) => void 
}

const utils = {
    generateDeferredPromise(): DeferredPromise {
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
}


export default {
    getApartmentFlower: (apartment: string): string => {
        try {
            const matches: Array<string> = apartment.match(/(.+?)-Apartment/);
            return matches[1];
        } catch (exception) {
            console.error(`apartment "${apartment}" does not match pattern *-Apartment.`);
            return "";
        }
    },

    getHotspot: (apartment: string): string => {
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

    getVoucherGueltigkeit: (abreise: string): string => {
        const abreiseParts: Array<string> = abreise.split(".");
        const abreiseDate: Date = new Date(Number(abreiseParts[2]), Number(abreiseParts[1]) - 1, Number(abreiseParts[0]));
        const lengthOfStay: number = Math.ceil((abreiseDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) + 1; // abreise - heute + 1

        if (lengthOfStay < 0) {
            alert("ungültige Aufenthaltsdauer: Abreise - Anreise < 0");
            return null;
        }

        let gueltigkeit = 7;

        if (lengthOfStay <= 7) {
            gueltigkeit = 7;
        } else if (lengthOfStay <= 10) {
            gueltigkeit = 10;
        } else if (lengthOfStay <= 14) {
            gueltigkeit = 14;
        } else if (lengthOfStay <= 16) {
            gueltigkeit = 16;
        } else if (lengthOfStay <= 22) {
            gueltigkeit = 22;
        } else {
            gueltigkeit = 40;
        }

        return `${gueltigkeit} Tage`;
    },

    getKommentar: (table_data: any) => {
        return `${table_data.nachname} ${table_data.apartment} ${table_data.anreise} bis ${table_data.abreise}`;
    },

    /**
     * 
     * @param {Array<{name: string, birthdate: string}>} namesAndBirthdates 
     * @param {string} anreise 
     * @returns 
     */
    getNumberOfKeys: (namesAndBirthdates: Array<{ name: string, birthdate: string }> | null, anreise: string): number => {
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
    }
};