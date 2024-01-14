import { MeldescheinGroup, Guest } from "../database/guest_excel";
import { Anrede as Title } from "../util/constants";
import constants from "../util/constants";
import ContentScriptConnector from "../content_scripts/connector";
import Database from "../database/database";
import contentScriptConnector from "../content_scripts/connector";
import uiHelper from "./ui_helper";


interface EventInput {
    value: string | number;
    event: "blur" | "change";
}

class FormData {
    anreise_input = "";
    abreise_input = "";

    nachname0 = ""; // Nachname Gast
    vorname0 = "";
    geburtsdatum0_input: EventInput | null;
    anrede0 = Title.Herr;
    staat0_input = "Deutschland";

    strasse0 = "";
    land0_input = "Deutschland";
    plz0_input = "";
    ort0_input = "";

    nachname1_input = ""; // Nachname Begl. 1
    vorname1 = "";
    geburtsdatum1_input: EventInput | null;
    anrede1 = Title.Herr;
    staat1_input = "Deutschland";

    vorname2 = "";
    geburtsdatum2_input: EventInput | null;

    vorname3 = "";
    geburtsdatum3_input: EventInput | null;

    vorname4 = "";
    geburtsdatum4_input: EventInput | null;

    vorname5 = "";
    geburtsdatum5_input: EventInput | null;

    email = "";
}

function fillMeldeschein(meldescheinGroup: MeldescheinGroup, arrival: Date, departure: Date, email: string, database: Database): void {
    fillNonInteractiveInformation(meldescheinGroup, arrival, departure, email)
        .then(() => fillTitleInformation(meldescheinGroup.guests, database))
        .then(() => console.log("finished filling meldeschein"))
        .catch((error: any) => console.error(error));
}

function fillNonInteractiveInformation(meldescheinGroup: MeldescheinGroup, arrival: Date, departure: Date, email: string): Promise<void> {
    const numberOfGuests = meldescheinGroup.guests.length;

    const formData = new FormData();
    formData.anreise_input = arrival.toLocaleDateString("de-DE");
    formData.abreise_input = departure.toLocaleDateString("de-DE");

    // each meldeschein group has at least one guest
    const guest1 = meldescheinGroup.guests[0];
    formData.nachname0 = guest1.lastname;
    formData.vorname0 = guest1.firstname;
    formData.geburtsdatum0_input = {
        value: guest1.birthdate.toLocaleDateString("de-DE"),
        event: "blur"
    };
    formData.staat0_input = guest1.nationality;

    // address
    formData.strasse0 = meldescheinGroup.streetAndNumber;
    formData.land0_input = meldescheinGroup.country;
    formData.plz0_input = meldescheinGroup.zip;
    formData.ort0_input = meldescheinGroup.city;

    // email
    formData.email = email || "";

    if (numberOfGuests >= 2) {
        const guest2 = meldescheinGroup.guests[1];
        formData.nachname1_input = guest2.lastname;
        formData.vorname1 = guest2.firstname;
        formData.geburtsdatum1_input = {
            value: guest2.birthdate.toLocaleDateString("de-DE"),
            event: "blur"
        };
        formData.staat1_input = guest2.nationality;
    }

    if (numberOfGuests >= 3) {
        const guest3 = meldescheinGroup.guests[2];
        formData.vorname2 = guest3.firstname;
        formData.geburtsdatum2_input = {
            value: guest3.birthdate.toLocaleDateString("de-DE"),
            event: "blur"
        };
    }

    if (numberOfGuests >= 4) {
        const guest4 = meldescheinGroup.guests[3];
        formData.vorname3 = guest4.firstname;
        formData.geburtsdatum3_input = {
            value: guest4.birthdate.toLocaleDateString("de-DE"),
            event: "blur"
        };
    }

    if (numberOfGuests >= 5) {
        const guest5 = meldescheinGroup.guests[4];
        formData.vorname4 = guest5.firstname;
        formData.geburtsdatum4_input = {
            value: guest5.birthdate.toLocaleDateString("de-DE"),
            event: "blur"
        };
    }

    if (numberOfGuests >= 6) {
        const guest6 = meldescheinGroup.guests[5];
        formData.vorname5 = guest6.firstname;
        formData.geburtsdatum5_input = {
            value: guest6.birthdate.toLocaleDateString("de-DE"),
            event: "blur"
        };
    }

    if (numberOfGuests >= 7) {
        alert("Mehr als 6 Gäste. Die Meldeschein Maske umfasst nur 6 Gäste.")
    }

    return ContentScriptConnector.send(formData);
}

function fillTitleInformation(guests: Array<Guest>, database: Database): void {
    console.log("filling title information");
    guests.forEach((guest: Guest, index: number) => {
        // title info is only needed for the first 2 entries
        if (index >= 2) {
            console.log(`skipping title for guest ${guest.firstname} because they are not one of the first 2`)
            return;
        }

        if (guest.firstname == null || guest.firstname == "") {
            console.log("skipping guest because firstname is empty");
            return;
        }

        database.getGender(guest.firstname)
            .then(
                // onFulfilled
                (gender: "M" | "F" | undefined) => {

                    if (gender === "M" || gender === "F") { // firstname has an entry in the firstname table
                        const title = constants.getTitle(gender);

                        // send data to content script fill_meldeschein.js
                        contentScriptConnector.send({
                            anrede0: title,
                            // Anrede der Begleitperson != Anrede des Buchenden
                            anrede1: title === Title.Herr ? Title.Frau : Title.Herr
                        });
                        return;
                    }

                    // firstname does not have an entry in the firstname table => query the user for its gender
                    const genderPopup = document.getElementById("firstname_gender");
                    uiHelper.showHtmlElement(genderPopup)
                    document.getElementById("firstname").textContent = `"${guest.firstname}"`;

                    document.getElementById("firstname_male").addEventListener("click", function handler(event) {
                        uiHelper.hideHtmlElement(genderPopup);
                        database.addFirstName(guest.firstname, "M");
                        contentScriptConnector.send({
                            anrede0: Title.Herr,
                            anrede1: Title.Frau,
                        });
                        event.target.removeEventListener(event.type, handler);
                    });

                    document.getElementById("firstname_female").addEventListener("click", function handler(event) {
                        uiHelper.hideHtmlElement(genderPopup);
                        database.addFirstName(guest.firstname, "F");
                        contentScriptConnector.send({
                            anrede0: Title.Frau,
                            anrede1: Title.Herr,
                        });
                        event.target.removeEventListener(event.type, handler);
                    });

                    document.getElementById("firstname_unknown").addEventListener("click", function handler(event) {
                        uiHelper.hideHtmlElement(genderPopup);
                        contentScriptConnector.send({
                            anrede0: Title.Gast,
                            anrede1: Title.Gast,
                        });
                        event.target.removeEventListener(event.type, handler);
                    });
                }

            )
            .catch(error => console.error(error));
    })
}

export default {
    fillMeldeschein: (meldescheinGroup: MeldescheinGroup, arrival: Date, departure: Date, email: string, database: Database): void => fillMeldeschein(meldescheinGroup, arrival, departure, email, database)
};