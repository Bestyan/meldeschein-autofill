import constants from './constants';
import connection from './connection';

export default {

    getEmailSettings() {

        return new Promise((resolve, reject) => {
            const email_settings_string = window.localStorage.getItem(constants.SETTINGS_EMAIL);
            if (!email_settings_string) {

                reject("Email Zugangsdaten fehlen. Siehe Einstellungen");
                return;

            }
            const email_settings = JSON.parse(email_settings_string);

            if (!email_settings.user ||
                !email_settings.password ||
                !email_settings.host ||
                !email_settings.port ||
                typeof email_settings.tls === 'undefined') {

                reject("Email Zugangsdaten fehlen. Siehe Einstellungen");
                return;

            }

            resolve(email_settings);
        });
    },

    /**
     * fetch all mails with the specified sender address
     * returns the response body { status, error, data: {mails} }
     */
    fetchMails(from) {

        return this.getEmailSettings()
            .then(email_settings => connection.post(constants.SERVER_FETCH_MAILS, {
                settings: email_settings,
                from: from
            }))
            .then(response => response.json());
    },

    /**
     * try to log in
     * returns the response body { status, error, data }
     */
    testConnection() {
        return this.getEmailSettings()
            .then(email_settings => connection.post(
                constants.SERVER_TEST_CONNECTION, {
                    settings: email_settings
                }
            ))
            .then(response => response.json());
    }

};