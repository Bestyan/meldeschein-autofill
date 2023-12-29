import { Row, CellValue } from "exceljs";
import { WorkSheet } from "xlsx";
import { Booking, Apartment } from "../util/constants";

export class ValidationError {
    rowNumber: number;
    field: string;
    value: string;
    message: string;
    constructor(field: string, value: string, message: string) {
        this.field = field;
        this.value = value;
        this.message = message;
    }

    toString(): string {
        return `${this.field} "${this.value}" ${this.message}`;
    }
}

const FIELD_TO_DISPLAYNAME = {
    arrival: "Anreise",
    departure: "Abreise",
    apartment: "Apartment",
    organiserFirstname: "Buchender Vorname",
    organiserLastname: "Buchender Nachname",
    meldescheinId: "MeldescheinId",
    guestLastname: "Nachname",
    guestFirstname: "Vorname",
    guestBirthdate: "Geburtsdatum",
    guestStreet: "Straße",
    guestZip: "PLZ",
    guestCity: "Ort",
    guestNationalityCode: "Nationalität"
};

export class RowValues {
    rowNumber: number;
    arrival: CellValue;
    departure: CellValue;
    apartment: string;
    organiserFirstname: string;
    organiserLastname: string;
    email: string;
    meldescheinId: CellValue;
    guestLastname: string;
    guestFirstname: string;
    guestBirthdate: CellValue;
    guestStreet: string;
    guestZip: string;
    guestCity: string;
    guestNationalityCode: string;

    constructor(rowNumber: number) {
        this.rowNumber = rowNumber;
    }

    validatePrimaryRow(): Array<ValidationError> {
        const errors: Array<ValidationError> = [];
        if (typeof this.arrival !== "object") {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["arrival"], this.arrival.toString(), "ist kein gültiges Datum"));
        }
        if (typeof this.departure !== "object") {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["departure"], this.departure.toString(), "ist kein gültiges Datum"));
        }
        if (this.apartment.length === 0) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["apartment"], this.apartment, "ist leer"));
        }
        if (!Object.values(Apartment).includes(this.apartment)) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["apartment"], this.apartment, "ist kein bekanntes Apartment"));
        }
        if (this.organiserFirstname.length === 0) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["organiserFirstname"], this.organiserFirstname, "ist leer"));
        }
        if (this.organiserLastname.length === 0) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["organiserLastname"], this.organiserLastname, "ist leer"));
        }
        errors.push(...this.validateGuestRow());
        return errors;
    }

    validateGuestRow(): Array<ValidationError> {
        const errors: Array<ValidationError> = [];
        if (typeof this.meldescheinId !== "number") {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["meldescheinId"], this.meldescheinId.toString(), "ist keine Zahl"));
        }
        if (this.guestLastname.length === 0) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["guestLastname"], this.guestLastname, "ist leer"));
        }
        if (this.guestFirstname.length === 0) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["guestFirstname"], this.guestFirstname, "ist leer"));
        }
        if (typeof this.guestBirthdate !== "object") {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["guestBirthdate"], this.guestBirthdate.toString(), "ist kein gültiges Datum"));
        }
        if (this.guestStreet.length === 0) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["guestStreet"], this.guestStreet, "ist leer"));
        }
        if (this.guestZip.length === 0) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["guestZip"], this.guestZip, "ist leer"));
        }
        if (this.guestCity.length === 0) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["guestCity"], this.guestCity, "ist leer"));
        }
        if (this.guestNationalityCode.length === 0) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["guestNationalityCode"], this.guestNationalityCode, "ist leer"));
        }
        return errors;
    }
}

export class GuestExcel {
    private sheet: WorkSheet;

    constructor(sheet: WorkSheet) {
        this.sheet = sheet;
        this.processSheet();
    }

    private processSheet() {
        const bookings: Array<Booking> = [];
        let currentBooking: Booking = new Booking();
        let isNewBooking = true;
        this.sheet.eachRow({ includeEmpty: true }, (row: Row, rowNumber: number) => {
            if (rowNumber <= 2) {
                return;
            }

            // 2 or more empty rows in a row
            if (!row.hasValues && isNewBooking) {
                return;
            }

            if (!row.hasValues) {
                bookings.push(currentBooking);
                currentBooking = new Booking();
                isNewBooking = true;
                return;
            }

            currentBooking.initFromRowValues(this.getRowValues(row, rowNumber));

        });
    }

    private getRowValues(row: Row, rowNumber: number): RowValues {
        const values = new RowValues(rowNumber);
        values.arrival = row.getCell("B").value;
        values.departure = row.getCell("C").value;
        values.apartment = row.getCell("D").text.trim();
        values.organiserFirstname = row.getCell("E").text.trim();
        values.organiserLastname = row.getCell("F").text.trim();
        values.email = row.getCell("G").text.trim();
        values.meldescheinId = row.getCell("I").value;
        values.guestLastname = row.getCell("K").text.trim();
        values.guestFirstname = row.getCell("L").text.trim();
        values.guestBirthdate = row.getCell("M").value;
        values.guestStreet = row.getCell("N").text.trim();
        values.guestZip = row.getCell("O").text.trim();
        values.guestCity = row.getCell("P").text.trim();
        values.guestNationalityCode = row.getCell("Q").text.trim();
        return values;
    }
}