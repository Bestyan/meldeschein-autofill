import uiHelper from "../util/ui_helper";
import { PopupController } from "./controller";
import { RowComponent, Tabulator, CellComponent } from "tabulator-tables";
import { Booking, MeldescheinGroup } from "../database/guest_excel";
import dataUtil from "../util/data_util";
import LocalStorage from "../database/local_storage";

export default class UI {
    private controller: PopupController;

    private searchResultsBookings: Array<Booking>;
    private searchResultsSection: HTMLElement = document.getElementById("search_results_section");
    private searchResultsTable: Tabulator;

    private allBookings: Array<Booking>;
    private allBookingsSection: HTMLElement = document.getElementById("bookings_section");
    private allBookingsTable: Tabulator;

    private meldescheinGroups: Array<MeldescheinGroup>;
    private meldescheinGroupsSection: HTMLElement = document.getElementById("meldeschein_groups_section");
    private meldescheinGroupsTable: Tabulator;

    constructor(controller: PopupController) {
        this.controller = controller;

        const searchResultsDiv = document.getElementById("search_results");
        this.searchResultsTable = uiHelper.createBookingsTabulatorTable(searchResultsDiv, [],
            (event: Event, row: RowComponent) => this.onBookingsSearchResultRowClick(event, row),
            (event: Event, cell: CellComponent) => this.onIsValidCellClick(cell, this.searchResultsBookings));

        const allBookingsResultDiv = document.getElementById("bookings_results");
        this.allBookingsTable = uiHelper.createBookingsTabulatorTable(allBookingsResultDiv, [],
            (event: Event, row: RowComponent) => this.onBookingsResultRowClick(event, row),
            (event: Event, cell: CellComponent) => this.onIsValidCellClick(cell, this.allBookings));

        const meldescheinGroupsResultDiv = document.getElementById("meldeschein_groups_results");
        this.meldescheinGroupsTable = uiHelper.createMeldescheinGroupsTabulatorTable(meldescheinGroupsResultDiv, [], (event: Event, row: RowComponent) => this.onMeldescheinGroupsResultRowClick(event, row));

    }

    initMinimizeButton(minimizeButton: HTMLElement) {
        minimizeButton.addEventListener("click", event => {
            uiHelper.hideContent();
            uiHelper.hideHtmlElement(minimizeButton);
            uiHelper.showHtmlElement(document.getElementById("maximize"));
        });
    };

    initMaximizeButton(maximizeButton: HTMLElement) {
        maximizeButton.addEventListener('click', event => {
            uiHelper.showContent();
            uiHelper.hideHtmlElement(maximizeButton);
            uiHelper.showHtmlElement(document.getElementById('minimize'));
        });
    };

    initSettingsButton(button: HTMLElement) {
        button.addEventListener('click', event => {
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
                return;
            }
            window.open(chrome.runtime.getURL('options.html'));
        });
    };

    initDeleteExcelDataButton(button: HTMLElement, refreshStatus: Function) {
        button.addEventListener('click', event => {
            this.controller.deleteExcelData();
            alert("Daten gelöscht");
            refreshStatus();
        });
    };

    initMailTemplateNames() {
        const mailTemplateNames = LocalStorage.getMailTemplateNames();
        const select = document.getElementById("mail_templates") as HTMLSelectElement;
        select.childNodes.forEach(child => select.removeChild(child));
        if (mailTemplateNames.length === 0) {
            select.appendChild(new Option("---", "no_templates"));
            return;
        }

        mailTemplateNames.forEach((templateName, index) => select.appendChild(new Option(templateName, `${index}`)));
    };

    initSearchDropDowns() {
        const searchDropdown = uiHelper.getHtmlSelectElement("search_field");
        const searchDateInput = uiHelper.getHtmlInputElement("search_input_date");
        const searchTextInput = uiHelper.getHtmlInputElement("search_input_text");

        searchDropdown.addEventListener("change", event => {
            const selected = searchDropdown.value;
            if (selected === "arrival" || selected === "departure") {
                uiHelper.showHtmlElement(searchDateInput);
                uiHelper.hideHtmlElement(searchTextInput);
            } else {
                uiHelper.showHtmlElement(searchTextInput);
                uiHelper.hideHtmlElement(searchDateInput);
            }
        });

        // preset the anreise/abreise search field to today
        searchDateInput.value = new Date().toISOString().substring(0, "yyyy-MM-dd".length);

        // +1 day on the anreise/abreise search field
        document.getElementById("date_plus_one").addEventListener("click", event => {
            searchDateInput.stepUp(1);
        });
        // -1 day on the anreise/abreise search field
        document.getElementById("date_minus_one").addEventListener("click", event => {
            searchDateInput.stepUp(-1);
        });
    };

    initGenerateMailButton() {
        document.getElementById('generate_mail').addEventListener('click', event => {
            const selectedBooking = this.getSelectedSearchResultsData();
            if (selectedBooking == null) {
                alert("keine Tabellenzeile ausgewählt");
                return;
            }
        
            const title = uiHelper.getHtmlSelectElement('mail_title').value;
            const selectTemplateValue = uiHelper.getHtmlSelectElement('mail_templates').value;
            if(selectTemplateValue === "no_templates"){
                alert("Keine Email Templates vorhanden! Bitte in den Plugin Einstellungen hochladen.")
                return;
            }
            const templateIndex = +selectTemplateValue;
        
            const mailText = this.controller.generateMailTextForTemplateIndex(templateIndex, selectedBooking, title);
            uiHelper.downloadMailTemplate(mailText, selectedBooking.organiserLastname);
        });
    }

    searchBookings(event: Event) {
        event.preventDefault();

        // hide the tables
        uiHelper.hideHtmlElement(this.meldescheinGroupsSection);
        uiHelper.hideHtmlElement(this.allBookingsSection);
        // show search results table, tabulator needs it to be visible
        uiHelper.showHtmlElement(this.searchResultsSection);

        const searchDropdown = uiHelper.getHtmlSelectElement("search_field");
        const searchDateInput = uiHelper.getHtmlInputElement("search_input_date");
        const searchTextInput = uiHelper.getHtmlInputElement("search_input_text");
        let searchValue: string;
        const searchColumn = searchDropdown.value;

        if (searchColumn === "arrival" || searchColumn === "departure") {
            searchValue = searchDateInput.value;
        } else {
            searchValue = searchTextInput.value;
        }

        this.searchResultsBookings = this.controller.findBookingsByColumnAndValue(searchColumn, searchValue);
        this.searchResultsTable.setData(dataUtil.clone(this.searchResultsBookings));

    };

    /**
     * what happens when you click on a row in the search_results table
     */
    onBookingsSearchResultRowClick(event: Event, row: RowComponent) {
        // hide meldeschein groups table
        uiHelper.hideHtmlElement(this.meldescheinGroupsSection);
        // show bookings table, tabulator needs it to be visible
        uiHelper.showHtmlElement(this.allBookingsSection);

        const selectedBooking = this.getSelectedSearchResultsData();
        if (selectedBooking == null) {
            return;
        }
        this.allBookings = this.controller.findBookingsByEmail(selectedBooking.email);
        this.allBookingsTable.setData(dataUtil.clone(this.allBookings));
    };

    /**
     * what happens when you click on a row in the booking_results table
     */
    onBookingsResultRowClick(event: Event, row: RowComponent) {
        // show meldeschein table, tabulator needs it to be visible
        uiHelper.showHtmlElement(this.meldescheinGroupsSection);

        const selectedBooking = this.getSelectedAllBookingsData();
        if (selectedBooking.meldescheinGroups == null) {
            return;
        }
        this.meldescheinGroups = selectedBooking.meldescheinGroups;
        this.meldescheinGroupsTable.setData(dataUtil.clone(this.meldescheinGroups));
    };

    /**
     * what happens when you click on the "valid" column in any Bookings table
     */
    onIsValidCellClick(cell: CellComponent, bookings: Array<Booking>): void {
        const clickedBooking = this.getBookingsDataByTableRow(cell.getRow(), bookings);
        if (clickedBooking.validationErrors.length === 0) {
            return;
        }
        console.log(clickedBooking);

        alert(dataUtil.formatValidationErrors(clickedBooking.validationErrors));
    }

    onMeldescheinGroupsResultRowClick(event: Event, row: RowComponent) {
        chrome.tabs.query({
            currentWindow: true,
            active: true
        },
            tabs => {
                let url = tabs[0].url || "";
                if (!url.toString().includes('emeldeschein.de')) {
                    return;
                }
                const searchedBooking = this.getSelectedSearchResultsData();
                if (searchedBooking == null) {
                    return;
                }
                // because the mutator alters the results of row.getData(), we need to get the original meldescheinGroup from the booking table
                const meldescheinGroup = this.getClickedMeldescheinGroupsData(row);
                this.controller.fillMeldeschein(meldescheinGroup, searchedBooking.arrival, searchedBooking.departure, searchedBooking.email);
            });
    };

    private getSelectedTableRow(table: Tabulator): any {
        if (table == null) {
            return null;
        }

        const selectedRows = table.getSelectedRows();
        if (selectedRows.length === 0) {
            return null;
        }

        return selectedRows[0].getData() as any;
    };

    getSelectedSearchResultsData(): Booking {
        const selectedTableRowData = this.getSelectedTableRow(this.searchResultsTable);
        if(selectedTableRowData == null){
            alert("keine Tabellenzeile ausgewählt");
            throw "getSelectedSearchResultsData(): keine Tabellenzeile ausgewählt";
        }
        return this.searchResultsBookings.filter(booking => booking.ID === selectedTableRowData.ID)[0];
    }

    getSelectedAllBookingsData(): Booking {
        const selectedTableRowData = this.getSelectedTableRow(this.allBookingsTable);
        if(selectedTableRowData == null){
            alert("keine Tabellenzeile ausgewählt");
            throw "getSelectedAllBookingsData(): keine Tabellenzeile ausgewählt";
        }
        return this.allBookings.filter(booking => booking.ID === selectedTableRowData.ID)[0];
    }

    getClickedMeldescheinGroupsData(row: RowComponent): MeldescheinGroup {
        return this.meldescheinGroups.filter(group => group.ID === row.getData().ID)[0];
    }

    getBookingsDataByTableRow(row: RowComponent, bookings: Array<Booking>): Booking {
        return bookings.filter(booking => booking.ID === row.getData().ID)[0];
    }

    initCheckinDocumentButton(): void {
        document.getElementById('checkin_download').addEventListener('click', event => {
            this.controller.generateCheckinDocument(this.getSelectedSearchResultsData());
        });
    }
}