
export default class PopupController{
    private database: any;

    constructor(database: any) {
        this.database = database;
    }

    deleteExcelData() {
        this.database.resetBookingsTable();
    }
};