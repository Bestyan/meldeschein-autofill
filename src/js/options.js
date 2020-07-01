import "../css/options.css";
import constants from "./constants";
import email from "./email";

alert = chrome.extension.getBackgroundPage().alert;
confirm = chrome.extension.getBackgroundPage().confirm;

function setStatus(text, cssClass){
    const status = document.getElementById("status");
    status.classList.remove("good", "bad");
    status.textContent = text;
    status.classList.add(cssClass);
}

function buildUI() {

    const user = document.getElementById("email_user");
    const password = document.getElementById("email_password");
    const host = document.getElementById("email_host");
    const port = document.getElementById("email_port");
    const tls = document.getElementById("email_tls");

    const loadSettingsFromStorage = () => {
        const settings_string = window.localStorage.getItem(constants.SETTINGS_EMAIL);

        if (!settings_string) {

            user.value = "";
            password.value = "";
            host.value = "";
            port.value = "993";
            tls.checked = true;

        } else {

            const settings = JSON.parse(settings_string);

            user.value = settings.user;
            password.value = "";
            host.value = settings.host;
            port.value = settings.port;
            tls.checked = settings.tls;

        }
    };

    // Button speichern
    document.getElementById("save").addEventListener("click", event => {
        // check for empty inputs
        if (!user.value ||
            !password.value ||
            !host.value ||
            !port.value) {
            alert("nicht alle Felder ausgefüllt");
            return;
        }

        // check if port is a number
        if (!+port.value) {
            alert("Port muss eine Zahl sein");
            return;
        }

        const settings = {
            user: user.value,
            password: password.value,
            host: host.value,
            port: port.value,
            tls: tls.checked
        };

        // save settings to local storage
        window.localStorage.setItem(constants.SETTINGS_EMAIL, JSON.stringify(settings));

        // test connection
        setStatus("Login testen ...", "bad");
        email.testConnection(responseBody => {
            if(responseBody.status === "ok"){
                setStatus("Login erfolgreich", "good");
            } else{
                setStatus(responseBody.error, "bad");
            }
        });
    });

    // Button zurücksetzen
    document.getElementById("reset").addEventListener("click", event => {
        loadSettingsFromStorage();
    });

    document.getElementById("wipe").addEventListener("click", event => {
        if (confirm(`Folgende Daten werden gelöscht:

        - Buchungs-Tabelle (importiertes xls)
        - Vornamens-Tabelle
        - E-Mail-Einstellungen

                                    Fortfahren?`)) {
            window.localStorage.clear();
        }
    })

    loadSettingsFromStorage();
}

buildUI();