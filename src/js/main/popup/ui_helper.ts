import { Tabulator, RowComponent, CellComponent } from 'tabulator-tables';
import dataUtil from '../util/data_util';
import { Booking, MeldescheinGroup, Guest } from '../database/guest_excel';


function dateMutator(value: Date | string, data: any, type: any, params: any, component: any): string {
    return dataUtil.formatDate(new Date(value));
}

function guestsMutator(value: Array<Guest>, data: any, type: any, params: any, component: any): string {
    return value.reduce((accumulator, guest) => accumulator + guest.firstname + ", ", "").slice(0, -2);
}

const utils = {
    // set visibility of the "loading..." layer that blocks interaction with any elements
    setLoadingOverlayVisible: (visible: boolean) => {
        const loadingScreen = document.getElementById('loading_screen');
        loadingScreen.classList.remove('hide', 'flex');
        if (visible) {
            loadingScreen.classList.add('flex');
        } else {
            loadingScreen.classList.add('hide');
        }
    },

    setContentVisible: (visible: boolean) => {
        const div = document.getElementById("content_container");
        div.classList.remove("hide");

        if (!visible) {
            div.classList.add("hide");
        }
    },

    createBookingsTabulatorTable: (selector: string | HTMLElement, rows: Array<Booking>, onRowClick: (event: Event, row: RowComponent) => void) => {
        const table = new Tabulator(selector, {
            layout: "fitData",
            layoutColumnsOnNewData: true,
            data: rows,
            selectableRollingSelection: true,
            selectable: 1,
            pagination: true,
            paginationSize: 10,
            columns: [{
                title: "Vorname",
                field: "organiserFirstname"
            },
            {
                title: "Nachname",
                field: "organiserLastname"
            },
            {
                title: "Anreise",
                field: "arrival",
                mutator: dateMutator
            },
            {
                title: "Abreise",
                field: "departure",
                mutator: dateMutator
            },
            {
                title: "Apartment",
                field: "apartment"
            },
            {
                title: "Email",
                field: "email"
            }
            ]
        });
        table.on("rowClick", onRowClick);
        return table;
    },

    createMeldescheinGroupsTabulatorTable: (selector: string | HTMLElement, rows: Array<MeldescheinGroup>, onRowClick: (event: Event, row: RowComponent) => void) => {
        const table = new Tabulator(selector, {
            layout: "fitData",
            layoutColumnsOnNewData: true, //TODO make default
            data: rows,
            columns: [{
                title: "Nr",
                field: "ID"
            },
            {
                title: "Gäste",
                field: "guests",
                mutator: guestsMutator
            },
            {
                title: "Straße + Hausnr",
                field: "streetAndNumber",
            },
            {
                title: "PLZ",
                field: "zip"
            },
            {
                title: "Ort",
                field: "city"
            }
            ]
        });
        table.on("rowClick", onRowClick);
        return table;
    },

    addCssClass: (element: HTMLElement, className: string) => {
        if(!element.classList.contains(className)){
            element.classList.add(className);
        }
    },

    removeCssClass: (element: HTMLElement, className: string) => {
        element.classList.remove(className);
    }
};

export default {
    hideLoadingOverlay: () => utils.setLoadingOverlayVisible(false),
    showLoadingOverlay: () => utils.setLoadingOverlayVisible(true),
    getHtmlInputElement: (id: string) => document.getElementById(id) as HTMLInputElement,
    getHtmlSelectElement: (id: string) => document.getElementById(id) as HTMLSelectElement,
    hideContent: () => utils.setContentVisible(false),
    showContent: () => utils.setContentVisible(true),
    createBookingsTabulatorTable: (selector: string | HTMLElement, rows: Array<Booking>, onRowClick: (event: Event, row: RowComponent) => void) =>
        utils.createBookingsTabulatorTable(selector, rows, onRowClick),
    showHtmlElement: (element: HTMLElement) => utils.removeCssClass(element, "hide"),
    hideHtmlElement: (element: HTMLElement) => utils.addCssClass(element, "hide"),
    createMeldescheinGroupsTabulatorTable: (selector: string | HTMLElement, rows: Array<MeldescheinGroup>, onRowClick: (event: Event, row: RowComponent) => void) =>
        utils.createMeldescheinGroupsTabulatorTable(selector, rows, onRowClick)
};