import { Tabulator, RowComponent, CellComponent } from 'tabulator-tables';
import dataUtil from './data_util';
import { Booking, MeldescheinGroup, Guest, ValidationError } from '../database/guest_excel';


function dateMutator(value: Date | string, data: any, type: any, params: any, component: any): string {
    return dataUtil.formatDate(new Date(value));
}

function guestsMutator(value: Array<Guest>, data: any, type: any, params: any, component: any): string {
    return value.reduce((accumulator, guest) => accumulator + guest.firstname + ", ", "").slice(0, -2);
}

function validationErrorsMutator(value: Array<ValidationError>, data: any, type: any, params: any, component: any): string {
    if (value.length > 0) {
        return "⚠️";
    }
    return "✔️";
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

    createBookingsTabulatorTable: (selector: string | HTMLElement, rows: Array<Booking>, onRowClick: (event: Event, row: RowComponent) => void, onIsValidCellClick: (event: Event, cell: CellComponent) => void) => {
        const table = new Tabulator(selector, {
            layout: "fitData",
            layoutColumnsOnNewData: true,
            data: rows,
            selectableRollingSelection: true,
            selectable: 1,
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
            },
            {
                title: "valid",
                field: "validationErrors",
                mutator: validationErrorsMutator,
                cellClick: onIsValidCellClick
            }]
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
        if (!element.classList.contains(className)) {
            element.classList.add(className);
        }
    },

    removeCssClass: (element: HTMLElement, className: string) => {
        element.classList.remove(className);
    },

    setTrafficLightEmoji: (element: HTMLElement, status: "red" | "yellow" | "green") => {
        let emoji = "";
        switch (status) {
            case 'red':
                emoji = "🔴";
                break;
            case 'yellow':
                emoji = "🟡";
                break;
            case 'green':
                emoji = "🟢";
                break;
            default:
                console.error(`illegal status in setTrafficLightEmoji: ${status}`);
                return;
        }
        element.innerHTML = emoji;
    },

    downloadMailTemplate(mailText: string, lastname: string) {
        let textFile: any = null;
        const makeTextFile = (text: string) => {
            const data = new Blob([text], {
                type: 'text/plain;charset=iso-8859-1'
            });

            if (textFile !== null) {
                window.URL.revokeObjectURL(textFile);
            }

            textFile = window.URL.createObjectURL(data);

            return textFile;
        };

        const link = document.createElement('a');
        link.href = makeTextFile(mailText);
        link.download = `bewertung_${lastname}.eml`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export default {
    hideLoadingOverlay: () => utils.setLoadingOverlayVisible(false),
    showLoadingOverlay: () => utils.setLoadingOverlayVisible(true),
    getHtmlInputElement: (id: string) => document.getElementById(id) as HTMLInputElement,
    getHtmlSelectElement: (id: string) => document.getElementById(id) as HTMLSelectElement,
    hideContent: () => utils.setContentVisible(false),
    showContent: () => utils.setContentVisible(true),
    createBookingsTabulatorTable: utils.createBookingsTabulatorTable,
    showHtmlElement: (element: HTMLElement) => utils.removeCssClass(element, "hide"),
    hideHtmlElement: (element: HTMLElement) => utils.addCssClass(element, "hide"),
    createMeldescheinGroupsTabulatorTable: utils.createMeldescheinGroupsTabulatorTable,
    setStatusEmoji: utils.setTrafficLightEmoji,
    downloadMailTemplate: utils.downloadMailTemplate
};