import { Database } from "../database/database";
import { MeldescheinGroup, Booking } from "../database/guest_excel";
import meldeschein from "./meldeschein";
import checkinDocument from "./checkin_document";

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
};