import constants from './constants';
import connection from './connection';

export default {

    getEmailSettings() {
        const email_settings_string = window.localStorage.getItem(constants.SETTINGS_EMAIL);
        if (!email_settings_string) {
            alert("Email Zugangsdaten fehlen. Siehe Einstellungen");
            return null;
        }
        const email_settings = JSON.parse(email_settings_string);

        if (!email_settings.user ||
            !email_settings.password ||
            !email_settings.host ||
            !email_settings.port ||
            typeof email_settings.tls === 'undefined') {
            alert("Email Zugangsdaten fehlen. Siehe Einstellungen");
            return null;
        }

        return email_settings;
    },

    /**
     * fetch all mails with the specified sender address
     * returns the response body { status, error, data: {mails} }
     * @param {function} callback 
     */
    fetchMails(from, callback) {
        const email_settings = this.getEmailSettings();
        if (!email_settings) {
            return;
        }

        connection.post(constants.SERVER_FETCH_MAILS, {
                settings: email_settings,
                from: from
            })
            .then(response => response.json())
            .then(json => callback(json))
            .catch(error => {
                callback({
                    status: "error",
                    error: error
                });
            });
    },

    /**
     * try to log in
     * returns the response body { status, error, data }
     * @param {function} callback 
     */
    testConnection(callback) {
        const email_settings = this.getEmailSettings();
        if (!email_settings) {
            return;
        }

        connection.post(constants.SERVER_TEST_CONNECTION, {
                settings: email_settings
            })
            .then(response => response.json())
            .then(json => callback(json))
            .catch(error => {
                callback({
                    status: "error",
                    error: error
                });
            });
    }
};