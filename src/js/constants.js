export default {

    SEARCH_RESULT_DATE_FORMAT: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    },

    BIRTHDAY_DATE_FORMAT : {
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
    getAnrede(gender){
        if(gender === "F"){
            return this.ANREDE_FRAU;
        }

        if (gender === "M") {
            return this.ANREDE_HERR;
        }

        return this.ANREDE_GAST;
    },

    SETTINGS_EMAIL: "settings_email",

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

    getServerURL() {
        const server_url = {
            production: "https://floating-hamlet-48922.herokuapp.com",
            development: "http://localhost:8000"
        };

        return server_url[process.env.NODE_ENV];
    },

    SERVER_WAKE_UP: "/wake-up",
    SERVER_FETCH_MAILS: "/fetch-mail",
    SERVER_TEST_CONNECTION: "/test-connection",
    SERVER_GET_VORNAME: "/db/get-firstname",
    SERVER_PUT_VORNAME: "/db/put-firstname",
    SERVER_GET_LOCATION: "/get-location"
};