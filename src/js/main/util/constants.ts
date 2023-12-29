import { RowValues, ValidationError } from "../database/bookings_excel";

const regionNamesToFull = new Intl.DisplayNames(['de'], { type: 'region' });

export enum Anrede {
    Herr = 1,
    Frau = 4,
    Gast = 48
}

export enum Apartment {
    "krokus",
    "enzian",
    "lavendel",
    "lilien",
    "rosen",
    "tulpen",
    "nelken",
    "narzissen"
}

export class Booking {
    organiser: Guest;
    anreise: Date;
    abreise: Date;
    apartment: string;
    email: string;
    meldescheinGroups: Array<MeldescheinGroup>;
    validationErrors: Array<ValidationError>;

    initFromRowValues(rowValues: RowValues): void {
        this.validationErrors = rowValues.validatePrimaryRow();
        this.organiser = new Guest();
        this.organiser.firstname = rowValues.organiserFirstname;
        this.organiser.lastname = rowValues.organiserLastname;
        this.organiser.birthdate = rowValues.guestBirthdate as Date;
        this.anreise = rowValues.arrival as Date;
        this.abreise = rowValues.departure as Date;
        this.apartment = rowValues.apartment;
        this.email = rowValues.email;
        this.meldescheinGroups = [];
    }

    addGuest(rowValues: RowValues): void {
        // get the meldeschein group whose id matches the meldescheinId in rowValues
        let foundExistingMeldescheinGroup = false;
        for(const meldescheinGroup of this.meldescheinGroups) {
            if (meldescheinGroup.id === Number(rowValues.meldescheinId)) {
                foundExistingMeldescheinGroup = true;
                meldescheinGroup.guests.push(Guest.fromRowValues(rowValues));
                break;
            }
        }

        if(!foundExistingMeldescheinGroup) {

        }
    }

    isValid(): boolean {
        return this.validationErrors.length === 0;
    }

    validate(): void {
        // TODO
    }
}

export class MeldescheinGroup {
    id: number;
    streetAndNumber: string;
    zip: string;
    city: string;
    country: string;
    guests: Array<Guest>;

    static fromRowValues(rowValues: RowValues): MeldescheinGroup {
        const meldescheinGroup = new MeldescheinGroup();
        meldescheinGroup.id = rowValues.meldescheinId as number;
        meldescheinGroup.streetAndNumber = rowValues.guestStreet;
        meldescheinGroup.zip = rowValues.guestZip;
        meldescheinGroup.city = rowValues.guestCity;
        meldescheinGroup.country = regionNamesToFull.of(rowValues.guestNationalityCode.toUpperCase());
        meldescheinGroup.guests = [Guest.fromRowValues(rowValues)];
        return meldescheinGroup
    }
}

export class Guest {

    firstname: string;
    lastname: string;
    birthdate: Date | null;
    nationality: string;

    static fromRowValues(rowValues: RowValues): Guest {
        const guest = new Guest();
        guest.firstname = rowValues.guestFirstname;
        guest.lastname = rowValues.guestLastname;
        guest.birthdate = rowValues.guestBirthdate as Date;
        guest.nationality = regionNamesToFull.of(rowValues.guestNationalityCode.toUpperCase());
        return guest;
    }
}

export default {

    SEARCH_RESULT_DATE_FORMAT: {
        year: "numeric" as "numeric" | "2-digit",
        month: '2-digit',
        day: '2-digit'
    },

    BIRTHDAY_DATE_FORMAT: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    },

    STATUS_DATE_FORMAT: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    },

    ANREDE_HERR: 1,
    ANREDE_FRAU: 4,
    ANREDE_GAST: 48,
    getAnrede(gender: string): Anrede {
        if (gender === "F") {
            return Anrede.Frau;
        }

        if (gender === "M") {
            return Anrede.Herr;
        }

        return Anrede.Gast;
    },

    SETTINGS_CHECKIN_DOCX: "settings_checkin_docx",
    SETTINGS_KEYS_XLS: "settings_keys_xls",

    BIRTHDATE_FIELDS: [
        "geburtsdatum0_input",
        "geburtsdatum1_input",
        "geburtsdatum2_input",
        "geburtsdatum3_input",
        "geburtsdatum4_input",
        "geburtsdatum5_input"
    ],

    FIRSTNAME_FIELDS: [
        "vorname0",
        "vorname1",
        "vorname2",
        "vorname3",
        "vorname4",
        "vorname5",
    ],

    LASTNAME_FIELDS: [
        "nachname0",
        "nachname1_input"
    ],

    ANREDE_FIELDS: [
        "anrede0",
        "anrede1"
    ],

    FIELDS_BEGL1: {
        birthdate: "geburtsdatum1_input",
        lastname: "nachname1_input"
    },

    getServerURL(): string {
        const serverUrl = {
            production: "https://meldeschein-autofill-server.onrender.com",
            development: "http://localhost:8000"
        };

        return serverUrl[process.env.NODE_ENV as "production" | "development"].toString();
    },

    SERVER_WAKE_UP: "/wake-up",
    SERVER_GET_VORNAME: "/db/get-firstname",
    SERVER_PUT_VORNAME: "/db/put-firstname"
};
