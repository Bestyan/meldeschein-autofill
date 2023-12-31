import uiHelper from "./ui_helper";
import { PopupController } from "./controller";
import { RowComponent } from "tabulator-tables";
import { Booking } from "../database/guest_excel";

export default class UI {
    private controller: PopupController;

    constructor(controller: PopupController) {
        this.controller = controller;
    }

    initMinimizeButton (minimizeButton: HTMLElement) {
        minimizeButton.addEventListener("click", event => {
            uiHelper.hideContent();
            uiHelper.hideHtmlElement(minimizeButton);
            uiHelper.showHtmlElement(document.getElementById("maximize"));
        });
    };

    initMaximizeButton (maximizeButton: HTMLElement) {
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

    initDeleteExcelDataButton (button: HTMLElement, refreshStatus: Function) {
        button.addEventListener('click', event => {
            this.controller.deleteExcelData();
            alert("Daten gelöscht");
            refreshStatus();
        });
    };

    /**
     * what happens when you click on a row in the search_results table
     */
    onBookingsSearchResultRowClick(event: Event, row: RowComponent) {
        // hide the other tables
        uiHelper.hideHtmlElement(document.getElementById("meldeschein_groups"));
        uiHelper.hideHtmlElement(document.getElementById("bookings"));

        const bookingsResultDiv = document.getElementById("bookings_results");
        const selectedBooking = row.getData() as Booking;
        const bookings = this.controller.findBookingsByEmail(selectedBooking.email);
        uiHelper.createBookingsTabulatorTable(bookingsResultDiv, bookings , (event: Event, row: RowComponent) => this.onBookingsResultRowClick(event, row));

        // show created table
        uiHelper.showHtmlElement(document.getElementById("bookings"));
    };

    /**
     * what happens when you click on a row in the booking_results table
     */
    onBookingsResultRowClick(event: Event, row: RowComponent) {
        uiHelper.hideHtmlElement(document.getElementById("meldeschein_groups"));

        const selectedBooking = row.getData() as Booking;
        const meldescheinGroupsResultDiv = document.getElementById("meldeschein_groups_results");
        uiHelper.createMeldescheinGroupsTabulatorTable(meldescheinGroupsResultDiv, selectedBooking.meldescheinGroups, (event: Event, row: RowComponent) => this.onMeldescheinGroupsResultRowClick(event, row));
    
        uiHelper.showHtmlElement(document.getElementById("meldeschein_groups"));
    };

    onMeldescheinGroupsResultRowClick(event: Event, row: RowComponent) {
        // TODO fill meldeschein if on meldeschein page
    };
}