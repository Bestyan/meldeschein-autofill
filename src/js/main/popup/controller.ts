import { Database } from "../database/database";
import { MeldescheinGroup, Booking } from "../database/guest_excel";
import meldeschein from "./meldeschein";
import checkinDocument from "./checkin_document";
import LocalStorage from "../database/local_storage";
import { Template } from "../mail_template/mail_templater";

export class PopupController{
    private database: Database;

    constructor(database: Database) {
        this.database = database;
    }

    deleteExcelData() {
        this.database.resetBookingsTable();
    }

    findBookingsByEmail(email: string) {
        return this.database.search("email", email);
    }

    findBookingsByColumnAndValue(column: string, value: string) {
        return this.database.search(column, value);
    }

    fillMeldeschein(meldescheinGroup: MeldescheinGroup, arrival: Date, departure: Date, email: string) {
        meldeschein.fillMeldeschein(meldescheinGroup, arrival, departure, email, this.database);
    }

    generateCheckinDocument(booking: Booking) {
        checkinDocument.generateDocument(booking, this.database.getApartmentKeyNames);
    }

    generateMailTextForTemplateIndex(templateIndex: number, booking: Booking, title: string) {
        const template = LocalStorage.getMailTemplateByIndex(templateIndex);
        return Template.generateEncodedMailText(template, booking, title);
    }
};