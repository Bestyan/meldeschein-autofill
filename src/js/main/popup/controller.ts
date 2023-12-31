import { Database } from "../database/database";

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
};