import { Tabulator } from 'tabulator-tables';
import dataUtil from '../util/data_util';
import { Booking } from '../database/guest_excel';


function dateMutator(value: Date | string, data: any, type: any, params: any, component: any): string {
    return dataUtil.formatDate(new Date(value));
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
    createBookingsTabulatorTable: (selector: string, rows: Array<Booking>) => {
        return new Tabulator(selector, {
            layout: "fitDataFill",
            data: rows,
            selectableRollingSelection: true,
            selectable: true,
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
    },
    addCssClass: (element: HTMLElement, className: string) => {
        element.classList.remove(className);
        element.classList.add(className);
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
    createBookingsTabulatorTable: (selector: string, rows: Array<Booking>) => utils.createBookingsTabulatorTable(selector, rows),
    addCssClass: (element: HTMLElement, className: string) => utils.addCssClass(element, className),
    removeCssClass: (element: HTMLElement, className: string) => utils.removeCssClass(element, className)
};