import { Database } from "../database/database";
import { MeldescheinGroup, Booking, GuestExcel } from "../database/guest_excel";
import meldeschein from "./meldeschein";
import checkinDocument from "./checkin_document";
import LocalStorage from "../database/local_storage";
import { Template } from "../mail_template/mail_templater";

export class PopupController{
    private database: Database;

    constructor(database: Database) {
        this.database = database;
    }

    uploadExcel(guestExcel: GuestExcel): void{
        this.database.initBookings(guestExcel.bookings);
    }

    deleteExcelData(): void {
        this.database.resetBookingsTable();
    }

    databaseHasData(): boolean {
        return this.database.hasData();
    }

    findBookingsByEmail(email: string): Array<Booking> {
        return this.database.search("email", email);
    }

    findBookingsByColumnAndValue(column: string, value: string): Array<Booking> {
        return this.database.search(column, value);
    }

    fillMeldeschein(meldescheinGroup: MeldescheinGroup, arrival: Date, departure: Date, email: string): void {
        meldeschein.fillMeldeschein(meldescheinGroup, arrival, departure, email, this.database);
    }

    generateCheckinDocument(booking: Booking): void {
        checkinDocument.generateDocument(booking, this.database.getApartmentKeyNames);
    }

    getMailTextForTemplateIndex(templateIndex: number, booking: Booking, title: string): string {
        const template = LocalStorage.getMailTemplateByIndex(templateIndex);
        return Template.generateEncodedMailText(template, booking, title);
    }
};