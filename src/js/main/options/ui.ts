import { OptionsController } from "./controller";
import constants from "../util/constants";
import uiHelper from "../util/ui_helper";

export default class UI {
    private controller: OptionsController;

    constructor(controller: OptionsController) {
        this.controller = controller;
    };

    /**
     * set the html content and the css classes of the checkin doc status field  
     * removes all css classes from the field before setting new ones
     */
    private setCheckInDocStatus(status: "red" | "yellow" | "green") {
        const uploadStatus = document.getElementById("checkin_docx_status");
        uiHelper.setStatusEmoji(uploadStatus, status);
    };

    /**
     * check local storage for existing checkin docx and set status field accordingly
     */
    private refreshCheckInDocStatus() {
        // check for an existing checkin docx
        const currentDocx = window.localStorage.getItem(constants.localStorage.keys.checkinDocxAsBinaryText);
        // set status accordingly
        if (currentDocx === null) {
            this.setCheckInDocStatus("red");
        } else {
            this.setCheckInDocStatus("green");
        }
    };

    // initialize the check-in document section
    initCheckinDocumentUI() {
        const uploadButton = document.getElementById("upload_checkin");

        this.refreshCheckInDocStatus();

        uploadButton.addEventListener("change", event => {

            this.setCheckInDocStatus("yellow");

            const toBinaryString = (file: File) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsBinaryString(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });

            const file = (event.target as HTMLInputElement).files[0];

            toBinaryString(file)
                .then((binaryString: string) => {
                    // save to local storage
                    window.localStorage.setItem(constants.localStorage.keys.checkinDocxAsBinaryText, binaryString);
                    this.refreshCheckInDocStatus();
                })
                .catch(error => {
                    console.error(error)
                    this.setCheckInDocStatus("red")
                });
        });
    };

    /**
     * set the html content and the css classes of the keys xls status field  
     * removes all css classes from the field before setting new ones
     */
    private setKeysXlsStatus(status: "red" | "yellow" | "green") {
        const uploadStatus = document.getElementById("keys_xls_status");
        uiHelper.setStatusEmoji(uploadStatus, status);
    };

    /**
     * check local storage for existing keys xls and set status field accordingly
     */
    private refreshKeysXlsStatus() {
        // check for an existing keys xls
        const currentXls = window.localStorage.getItem(constants.localStorage.keys.keysXlsStatus);
        // set status accordingly
        if (currentXls === null) {
            this.setKeysXlsStatus("red");
        } else {
            this.setKeysXlsStatus("green");
        }
    };

    // initialize the keys section
    initKeysUI() {
        const uploadButton = document.getElementById("upload_keys");
        this.refreshKeysXlsStatus();
        uploadButton.addEventListener("change", event => {
            this.setKeysXlsStatus("yellow");
            this.controller.uploadKeysXls(event.target as HTMLInputElement, () => this.refreshKeysXlsStatus(), () => this.setKeysXlsStatus("red"))
        });
    };

    private refreshEmailTemplateStatus(statusElement: HTMLElement, localStorageKey: string) {
        const emailText = window.localStorage.getItem(localStorageKey);
        if (emailText === null) {
            uiHelper.setStatusEmoji(statusElement, "red");
        } else {
            uiHelper.setStatusEmoji(statusElement, "green");
        }
    }

    private initEmailTemplateUI(options: {
        plain: {
            status: HTMLElement
            uploadButton: HTMLInputElement,
            localStorageKey: string
        },
        html: {
            status: HTMLElement
            uploadButton: HTMLInputElement,
            localStorageKey: string
        }
    }) {
        this.refreshEmailTemplateStatus(options.plain.status, options.plain.localStorageKey);
        options.plain.uploadButton.addEventListener("change",
        event => {
            uiHelper.setStatusEmoji(options.plain.status, "yellow");
            this.controller.uploadMailTemplate(
                options.plain.uploadButton,
                options.plain.localStorageKey,
                () => { uiHelper.setStatusEmoji(options.plain.status, "green"); },
                () => { uiHelper.setStatusEmoji(options.plain.status, "red"); });
            })
            
        this.refreshEmailTemplateStatus(options.html.status, options.html.localStorageKey);
        options.html.uploadButton.addEventListener("change",
            event => {
                uiHelper.setStatusEmoji(options.html.status, "yellow");
                this.controller.uploadMailTemplate(
                    options.html.uploadButton,
                    options.html.localStorageKey,
                    () => { uiHelper.setStatusEmoji(options.html.status, "green"); },
                    () => { uiHelper.setStatusEmoji(options.html.status, "red"); });
            })
    };

    initEmailTemplatesUI() {
        const individualTemplate = {
            plain: {
                status: document.getElementById("mail_template_plain_du_status"),
                uploadButton: document.getElementById("upload_template_plain_du") as HTMLInputElement,
                localStorageKey: constants.localStorage.keys.mailTemplates.individual.plain
            },
            html: {
                status: document.getElementById("mail_template_html_du_status"),
                uploadButton: document.getElementById("upload_template_html_du") as HTMLInputElement,
                localStorageKey: constants.localStorage.keys.mailTemplates.individual.html
            }
        };
        this.initEmailTemplateUI(individualTemplate);

        const generalTemplateFirstVisit = {
            plain: {
                status: document.getElementById("mail_template_plain_sie_firstvisit_status"),
                uploadButton: document.getElementById("upload_template_plain_sie_firstvisit") as HTMLInputElement,
                localStorageKey: constants.localStorage.keys.mailTemplates.generalFirstVisit.plain
            },
            html: {
                status: document.getElementById("mail_template_html_sie_firstvisit_status"),
                uploadButton: document.getElementById("upload_template_html_sie_firstvisit") as HTMLInputElement,
                localStorageKey: constants.localStorage.keys.mailTemplates.generalFirstVisit.html
            }
        };
        this.initEmailTemplateUI(generalTemplateFirstVisit);

        const generalTemplate = {
            plain: {
                status: document.getElementById("mail_template_plain_sie_status"),
                uploadButton: document.getElementById("upload_template_plain_sie") as HTMLInputElement,
                localStorageKey: constants.localStorage.keys.mailTemplates.general.plain
            },
            html: {
                status: document.getElementById("mail_template_html_sie_status"),
                uploadButton: document.getElementById("upload_template_html_sie") as HTMLInputElement,
                localStorageKey: constants.localStorage.keys.mailTemplates.general.html
            }
        };
        this.initEmailTemplateUI(generalTemplate);
    };
}