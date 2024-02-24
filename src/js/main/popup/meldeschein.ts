import { MeldescheinGroup, Guest } from "../database/guest_excel";
import { Title as Title } from "../util/constants";
import constants from "../util/constants";
import ContentScriptConnector from "../content_scripts/connector";
import Database from "../database/database";
import contentScriptConnector from "../content_scripts/connector";
import uiHelper from "../util/ui_helper";
import dataUtil from "../util/data_util";


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
    passnumber = "";

    strasse0 = "";
    land0_input = "Deutschland";
    plz0_input = "";
    ort0_input = "";

    nachname1_input = ""; // Nachname Begl. 1
    vorname1 = "";
    geburtsdatum1_input: EventInput | null;
    anrede1 = Title.Herr;
    staat1_input = "Deutschland";
    passnumber1 = "";

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

class TitleData {
    anrede0: Title;
    anrede1: Title;
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
    formData.anreise_input = dataUtil.formatDate(arrival);
    formData.abreise_input = dataUtil.formatDate(departure);

    // each meldeschein group has at least one guest
    const guest1 = meldescheinGroup.guests[0];
    formData.nachname0 = guest1.lastname;
    formData.vorname0 = guest1.firstname;
    formData.geburtsdatum0_input = {
        value: dataUtil.formatDate(guest1.birthdate),
        event: "blur"
    };
    formData.staat0_input = guest1.nationality;
    formData.passnumber = guest1.passportCode;

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
            value: dataUtil.formatDate(guest2.birthdate),
            event: "blur"
        };
        formData.staat1_input = guest2.nationality;
        formData.passnumber1 = guest2.passportCode;
    }

    if (numberOfGuests >= 3) {
        const guest3 = meldescheinGroup.guests[2];
        formData.vorname2 = guest3.firstname;
        formData.geburtsdatum2_input = {
            value: dataUtil.formatDate(guest3.birthdate),
            event: "blur"
        };
    }

    if (numberOfGuests >= 4) {
        const guest4 = meldescheinGroup.guests[3];
        formData.vorname3 = guest4.firstname;
        formData.geburtsdatum3_input = {
            value: dataUtil.formatDate(guest4.birthdate),
            event: "blur"
        };
    }

    if (numberOfGuests >= 5) {
        const guest5 = meldescheinGroup.guests[4];
        formData.vorname4 = guest5.firstname;
        formData.geburtsdatum4_input = {
            value: dataUtil.formatDate(guest5.birthdate),
            event: "blur"
        };
    }

    if (numberOfGuests >= 6) {
        const guest6 = meldescheinGroup.guests[5];
        formData.vorname5 = guest6.firstname;
        formData.geburtsdatum5_input = {
            value: dataUtil.formatDate(guest6.birthdate),
            event: "blur"
        };
    }

    if (numberOfGuests >= 7) {
        alert("Mehr als 6 Gäste. Die Meldeschein Maske umfasst nur 6 Gäste.")
    }

    return ContentScriptConnector.send(formData);
}

async function fillTitleInformation(guests: Array<Guest>, database: Database): Promise<any> {
    console.log("filling title information");

    let titleData: TitleData;

    for(let guestIndex = 0; guestIndex < guests.length; guestIndex++){
        const guest = guests[guestIndex];
        // title info is only needed for the first 2 entries
        if (guestIndex >= 2) {
            console.log(`skipping title for guest ${guest.firstname} because they are not one of the first 2`)
            return;
        }

        if (guest.firstname == null || guest.firstname == "") {
            console.log("skipping guest because firstname is empty");
            return;
        }

        const gender = await database.getGender(guest.firstname).catch(error => console.error(error)) as "M" | "F" | undefined;

        if (gender === "M" || gender === "F") { // firstname has an entry in the firstname table
            titleData = getContentScriptTitleDataFor(guestIndex as 0 | 1, constants.getTitle(gender));
            break;
        }
        queryUserForFirstnameGender(guest, guestIndex as 0 | 1, database);
    }

    contentScriptConnector.send(titleData);
}

function queryUserForFirstnameGender(guest: Guest, guestIndex: 0 | 1, database: Database): void {
    // firstname does not have an entry in the firstname table => query the user for its gender
    const genderPopup = document.getElementById("firstname_gender");
    uiHelper.showHtmlElement(genderPopup)
    document.getElementById("firstname").textContent = `"${guest.firstname}"`;

    document.getElementById("firstname_male").addEventListener("click", function handler(event) {
        uiHelper.hideHtmlElement(genderPopup);
        database.addFirstName(guest.firstname, "M");
        contentScriptConnector.send(getContentScriptTitleDataFor(guestIndex, Title.Herr));
        event.target.removeEventListener(event.type, handler);
    });

    document.getElementById("firstname_female").addEventListener("click", function handler(event) {
        uiHelper.hideHtmlElement(genderPopup);
        database.addFirstName(guest.firstname, "F");
        contentScriptConnector.send(getContentScriptTitleDataFor(guestIndex, Title.Frau));
        event.target.removeEventListener(event.type, handler);
    });

    document.getElementById("firstname_unknown").addEventListener("click", function handler(event) {
        uiHelper.hideHtmlElement(genderPopup);
        // only if the first guest's gender is unknown, "Gast" is sent
        // Otherwise the inferred gender via the partner's title might be overridden
        if(guestIndex == 0){
            contentScriptConnector.send(getContentScriptTitleDataFor(guestIndex, Title.Gast));
        }
        event.target.removeEventListener(event.type, handler);
    });
}

function getContentScriptTitleDataFor(guestIndex: 0 | 1, title: Title): TitleData {
    const oppositeTitle = this.getAntonymTitle(title);

    if(guestIndex == 0){
        return { 
            anrede0: title,
            anrede1: oppositeTitle
        };
    }
    if(guestIndex == 1){
        return { 
            anrede0: oppositeTitle,
            anrede1: title
        };
    }
}

export default {
    fillMeldeschein: fillMeldeschein
};