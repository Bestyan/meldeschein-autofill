import 'regenerator-runtime/runtime'; // required by exceljs
import { Row, CellValue, Worksheet } from "exceljs";
import { Apartment } from "../util/constants";
import DataUtil from '../util/data_util';

const regionNamesToFull = new Intl.DisplayNames(['de'], { type: 'region' });

export class ValidationError {
    rowNumber: number;
    field: string;
    badValue: string;
    message: string;
    constructor(field: string, value: string, message: string) {
        this.field = field;
        this.badValue = value;
        this.message = message;
    };

    public static toMessage(error: ValidationError): string {
        return `Zeile ${error.rowNumber}: ${error.field} "${error.badValue}" ${error.message}`;
    };
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
    guestNationalityCode: "Nationalität",
    guestPassportCode: "Passnummer"
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
    guestPassportCode: string;

    constructor(rowNumber: number) {
        this.rowNumber = rowNumber;
    }

    validateBookingColumns(): Array<ValidationError> {
        const errors: Array<ValidationError> = [];
        const arrivalDate = DataUtil.parseDateCell(this.arrival);
        const departureDate = DataUtil.parseDateCell(this.departure);
        let arrivalIsDate = true;
        if (!this.arrival || arrivalDate === null) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["arrival"], (this.arrival as string || ""), "ist kein gültiges Datum"));
            arrivalIsDate = false;
        }
        let departureIsDate = true;
        if (!this.departure || departureDate === null) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["departure"], (this.departure as string || ""), "ist kein gültiges Datum"));
            departureIsDate = false;
        }
        if (arrivalIsDate && departureIsDate && arrivalDate.getTime() >= departureDate.getTime()) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["arrival"], DataUtil.formatDate(this.arrival as Date), "ist gleich oder nach dem Abreisedatum"));
        }
        if (!this.apartment || this.apartment.length === 0) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["apartment"], this.apartment, "ist leer"));
        }
        if (this.apartment && !Object.values(Apartment).includes(this.apartment.toLowerCase())) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["apartment"], this.apartment, "ist kein bekanntes Apartment"));
        }
        if (!this.organiserFirstname || this.organiserFirstname.length === 0) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["organiserFirstname"], this.organiserFirstname, "ist leer"));
        }
        if (!this.organiserFirstname || this.organiserLastname.length === 0) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["organiserLastname"], this.organiserLastname, "ist leer"));
        }
        errors.forEach(error => error.rowNumber = this.rowNumber);
        return errors;
    }

    validateGuestColumns(): Array<ValidationError> {
        const errors: Array<ValidationError> = [];
        if (!this.meldescheinId || typeof this.meldescheinId !== "number") {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["meldescheinId"], this.meldescheinId as string, "ist keine Zahl"));
        }
        if (!this.guestLastname || this.guestLastname.length === 0) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["guestLastname"], this.guestLastname, "ist leer"));
        }
        if (!this.guestFirstname || this.guestFirstname.length === 0) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["guestFirstname"], this.guestFirstname, "ist leer"));
        }
        if (!this.guestBirthdate || DataUtil.parseDateCell(this.guestBirthdate) === null) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["guestBirthdate"], (this.guestBirthdate as string || ""), "ist kein gültiges Datum"));
        }
        if (!this.guestStreet || this.guestStreet.length === 0) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["guestStreet"], this.guestStreet, "ist leer"));
        }
        if (!this.guestZip || this.guestZip.length === 0) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["guestZip"], this.guestZip, "ist leer"));
        }
        if (!this.guestCity || this.guestCity.length === 0) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["guestCity"], this.guestCity, "ist leer"));
        }

        const hasEmptyNationalityCode = !this.guestNationalityCode || this.guestNationalityCode.length === 0;
        if (hasEmptyNationalityCode) {
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["guestNationalityCode"], this.guestNationalityCode, "ist leer"));
        }
        if(!hasEmptyNationalityCode) {
            try {
                regionNamesToFull.of(this.guestNationalityCode);
            } catch (error) {
                errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["guestNationalityCode"], this.guestNationalityCode, "ist kein gültiger Ländercode"));
            }
        }
        const livesOutsideGermany = !hasEmptyNationalityCode && this.guestNationalityCode.toLowerCase() !== "de";
        const hasEmptyPassportNumber = !this.guestPassportCode || this.guestPassportCode.length === 0;
        if(livesOutsideGermany && hasEmptyPassportNumber){
            errors.push(new ValidationError(FIELD_TO_DISPLAYNAME["guestPassportCode"], this.guestPassportCode, "ist leer bei nicht-deutschem Ländercode"))
        }
        errors.forEach(error => error.rowNumber = this.rowNumber);
        return errors;
    }
}

export class GuestExcel {
    bookings: Array<Booking> = [];

    constructor(sheet: Worksheet) {
        this.processSheet(sheet);
    }

    private processSheet(sheet: Worksheet) {
        let currentBooking = new Booking();
        let isNewBooking = true;
        sheet.eachRow({ includeEmpty: true }, (row: Row, rowNumber: number) => {
            if (rowNumber <= 2) {
                return;
            }

            // 2 or more empty rows in a row
            if (!row.hasValues && isNewBooking) {
                return;
            }

            // empty row after a non-empty row
            if (!row.hasValues) {
                this.bookings.push(currentBooking);
                isNewBooking = true;
                return;
            }

            const rowValues = this.extractRowValues(row, rowNumber);

            // first row after empty row
            if (isNewBooking) {
                currentBooking = Booking.fromRowValues(rowValues);
                isNewBooking = false;
            }

            currentBooking.addGuest(rowValues);
        });

        // if the last row was not empty, add the last booking
        if (!isNewBooking) {
            this.bookings.push(currentBooking);
        }
        console.log(this.bookings);
    }

    private extractRowValues(row: Row, rowNumber: number): RowValues {
        const values = new RowValues(rowNumber);
        values.arrival = row.getCell("B").value;
        values.departure = row.getCell("C").value;
        values.apartment = row.getCell("D").text.trim();
        values.organiserLastname = row.getCell("E").text.trim();
        values.organiserFirstname = row.getCell("F").text.trim();
        values.email = row.getCell("G").text.trim();
        values.meldescheinId = row.getCell("I").value;
        values.guestLastname = row.getCell("K").text.trim();
        values.guestFirstname = row.getCell("L").text.trim();
        values.guestBirthdate = row.getCell("M").value;
        values.guestStreet = row.getCell("N").text.trim();
        values.guestZip = row.getCell("O").text.trim();
        values.guestCity = row.getCell("P").text.trim();
        values.guestNationalityCode = row.getCell("Q").text.trim();
        values.guestPassportCode = row.getCell("R").text.trim();
        return values;
    }
}

export class Booking {
    ID: number;
    organiserFirstname: string;
    organiserLastname: string;
    arrival: Date;
    departure: Date;
    apartment: string;
    email: string;
    meldescheinGroups: Array<MeldescheinGroup>;
    validationErrors: Array<ValidationError>;

    static fromRowValues(rowValues: RowValues): Booking {
        const booking = new Booking();
        // validate the non-guest columns
        booking.validationErrors = rowValues.validateBookingColumns();

        booking.organiserFirstname = rowValues.organiserFirstname;
        booking.organiserLastname = rowValues.organiserLastname;
        booking.arrival = DataUtil.parseDateCell(rowValues.arrival);
        booking.departure = DataUtil.parseDateCell(rowValues.departure);
        booking.apartment = rowValues.apartment;
        booking.email = rowValues.email;
        booking.meldescheinGroups = [];
        return booking;
    }

    static fromQueryResult(row: any): Booking {
        const booking = row as Booking;
        booking.arrival = new Date(row.arrival);
        booking.departure = new Date(row.departure);
        booking.meldescheinGroups = row.meldescheinGroups.map((meldescheinGroup: any) => MeldescheinGroup.fromQueryResult(meldescheinGroup));
        return booking;
    }

    addGuest(rowValues: RowValues): void {
        // validate guest columns
        this.validationErrors.push(...rowValues.validateGuestColumns());

        // get the meldeschein group whose id matches the meldescheinId in rowValues
        let foundExistingMeldescheinGroup = false;
        for (const meldescheinGroup of this.meldescheinGroups) {
            if (meldescheinGroup.ID === Number(rowValues.meldescheinId)) {
                foundExistingMeldescheinGroup = true;
                meldescheinGroup.guests.push(Guest.fromRowValues(rowValues));
                break;
            }
        }

        if (!foundExistingMeldescheinGroup) {
            this.meldescheinGroups.push(MeldescheinGroup.fromRowValues(rowValues));
        }
    }

    isValid(): boolean {
        return this.validationErrors.length === 0;
    }
}

export class MeldescheinGroup {
    ID: number;
    streetAndNumber: string;
    zip: string;
    city: string;
    country: string;
    guests: Array<Guest>;

    static fromRowValues(rowValues: RowValues): MeldescheinGroup {
        const meldescheinGroup = new MeldescheinGroup();
        meldescheinGroup.ID = Number(rowValues.meldescheinId);
        meldescheinGroup.streetAndNumber = rowValues.guestStreet;
        meldescheinGroup.zip = rowValues.guestZip;
        meldescheinGroup.city = rowValues.guestCity;
        meldescheinGroup.country = DataUtil.tryCountryCode(rowValues.guestNationalityCode);
        meldescheinGroup.guests = [Guest.fromRowValues(rowValues)];
        return meldescheinGroup
    }

    static fromQueryResult(queryResult: any): MeldescheinGroup {
        const meldescheinGroup = queryResult as MeldescheinGroup;
        meldescheinGroup.guests = queryResult.guests.map((guest: any) => Guest.fromQueryResult(guest));
        return meldescheinGroup;
    }
}

export class Guest {
    ID: number;
    firstname: string;
    lastname: string;
    birthdate: Date | null;
    nationality: string;
    passportCode: string;

    static fromRowValues(rowValues: RowValues): Guest {
        const guest = new Guest();
        guest.firstname = rowValues.guestFirstname;
        guest.lastname = rowValues.guestLastname;
        guest.birthdate = DataUtil.parseDateCell(rowValues.guestBirthdate);
        guest.nationality = DataUtil.tryCountryCode(rowValues.guestNationalityCode);
        guest.passportCode = rowValues.guestPassportCode;
        return guest;
    }

    static fromQueryResult(queryResult: any): Guest {
        const guest = queryResult as Guest;
        guest.birthdate = new Date(queryResult.birthdate);
        return guest;
    }
}