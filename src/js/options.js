import "../css/options.css";
import constants from "./constants";
import email from "./email";

alert = chrome.extension.getBackgroundPage().alert;
confirm = chrome.extension.getBackgroundPage().confirm;

const setEmailStatus = (text, ...cssClasses) => {
    const status = document.getElementById("status");
    status.classList.remove("good", "bad");
    status.textContent = text;
    status.classList.add(cssClasses);
}

const setCheckInDocStatus = (htmlContent, ...cssClasses) => {
    const uploadStatus = document.getElementById("checkin_docx_status");
    // remove all classes
    uploadStatus.classList.remove(...uploadStatus.classList);
    uploadStatus.innerHTML = htmlContent;
    uploadStatus.classList.add("bold", cssClasses);
};

const refreshCheckInDocStatus = () => {
    // check for an existing checkin docx
    let currentDocx = window.localStorage.getItem(constants.SETTINGS_CHECKIN_DOCX);
    // set status accordingly
    if (currentDocx === null) {
        setCheckInDocStatus("fehlt &cross;", "bad");
    } else {
        setCheckInDocStatus("vorhanden &check;", "good");
    }
};

function buildMailSettingsUI() {

    const userInput = document.getElementById("email_user");
    const passwordInput = document.getElementById("email_password");
    const hostInput = document.getElementById("email_host");
    const portInput = document.getElementById("email_port");
    const tlsCheckbox = document.getElementById("email_tls");

    const loadEmailSettingsFromStorage = () => {
        const settings_string = window.localStorage.getItem(constants.SETTINGS_EMAIL);

        if (!settings_string) {

            userInput.value = "";
            passwordInput.value = "";
            hostInput.value = "";
            portInput.value = "993";
            tlsCheckbox.checked = true;

        } else {

            const settings = JSON.parse(settings_string);

            userInput.value = settings.user;
            passwordInput.value = "";
            hostInput.value = settings.host;
            portInput.value = settings.port;
            tlsCheckbox.checked = settings.tls;

        }
    };

    // Button speichern
    document.getElementById("save").addEventListener("click", event => {
        // check for empty inputs
        if (!userInput.value ||
            !passwordInput.value ||
            !hostInput.value ||
            !portInput.value) {
            alert("nicht alle Felder ausgefüllt");
            return;
        }

        // check if port is a number
        if (!+portInput.value) {
            alert("Port muss eine Zahl sein");
            return;
        }

        const settings = {
            user: userInput.value,
            password: passwordInput.value,
            host: hostInput.value,
            port: portInput.value,
            tls: tlsCheckbox.checked
        };

        // save settings to local storage
        window.localStorage.setItem(constants.SETTINGS_EMAIL, JSON.stringify(settings));

        // test connection
        setEmailStatus("Login testen ...", "bad");
        email.testConnection()
            .then(
                responseBody => {
                    if (responseBody.status === "ok") {
                        setEmailStatus("Login erfolgreich", "good");
                    } else {
                        setEmailStatus(responseBody.error, "bad");
                    }
                })
            .catch(error => alert(error));
    });

    // Button zurücksetzen
    document.getElementById("reset").addEventListener("click", event => {
        loadEmailSettingsFromStorage();
    });

    document.getElementById("wipe").addEventListener("click", event => {
        if (confirm(`Folgende Daten werden gelöscht:

        - Buchungs-Tabelle (importiertes xls)
        - E-Mail-Einstellungen
        - Check-in Dokument (importiertes docx)

                                    Fortfahren?`)) {
            window.localStorage.clear();
            refreshCheckInDocStatus();
        }
    })

    loadEmailSettingsFromStorage();
}

function buildCheckinDocumentUI() {
    const uploadButton = document.getElementById("upload_checkin");

    refreshCheckInDocStatus();

    uploadButton.addEventListener("change", event => {

        setCheckInDocStatus("lädt...", "bad");

        const toBinaryString = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsBinaryString(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

        const file = event.target.files[0];

        toBinaryString(file)
            .then(binaryString => {
                // save to local storage
                window.localStorage.setItem(constants.SETTINGS_CHECKIN_DOCX, binaryString);
                refreshCheckInDocStatus();
            })
            .catch(error => setCheckInDocStatus(error.toString(), "bad"));
    });

}

function buildUI() {
    buildMailSettingsUI();
    buildCheckinDocumentUI();
}

buildUI();