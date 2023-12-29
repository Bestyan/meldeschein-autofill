
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
