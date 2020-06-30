export default {

    SEARCH_RESULT_DATE_FORMAT: {
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

    SETTINGS_EMAIL: "settings_email",

    getServerURL(){
        const server_url = {
            production: "https://floating-hamlet-48922.herokuapp.com",
            development: "http://localhost:8000"
        };
        console.log(process.env.NODE_ENV);

        return server_url[process.env.NODE_ENV];
    }
};