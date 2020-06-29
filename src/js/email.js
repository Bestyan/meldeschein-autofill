
import constants from './constants';

export default {

    fetchMails(from) {
        const email_settings = window.localStorage.getItem(constants.SETTINGS_EMAIL);

        if (!email_settings.user ||
            !email_settings.password ||
            !email_settings.host ||
            !email_settings.port ||
            email_settings.tls === undefined) {
            alert("Email Zugangsdaten fehlen. Siehe Einstellungen");
            return;
        }

        fetch("http:/localhost:8000/fetch-mail", {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({
                settings: email_settings,
                from: from
            })
        })
        .then(response => response.json())
        .then(json => console.log(json))
        .catch(error => console.log(error));

        imap.connect();
    },

    testConnection(){
        const email_settings = window.localStorage.getItem(constants.SETTINGS_EMAIL);

        if (!email_settings.user ||
            !email_settings.password ||
            !email_settings.host ||
            !email_settings.port ||
            email_settings.tls === undefined) {
            alert("Email Zugangsdaten fehlen. Siehe Einstellungen");
            return;
        }

        fetch("http:/localhost:8000/test-connection", {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify({
                settings: email_settings
            })
        })
        .then(response => response.json())
        .then(json => console.log(json))
        .catch(error => console.log(error));
    }
};