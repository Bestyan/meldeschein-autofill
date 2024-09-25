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

    initEmailTemplatesUI() {
        const options = {
            status: document.getElementById("mail_templates_status"),
            uploadButton: document.getElementById("upload_mail_templates") as HTMLInputElement,
            localStorageKey: constants.localStorage.keys.mailTemplateNames
        };

        this.refreshEmailTemplateStatus(options.status, options.localStorageKey);
        options.uploadButton.addEventListener("change",
            event => {
                uiHelper.setStatusEmoji(options.status, "yellow");
                this.controller.uploadMailTemplate(options.uploadButton)
                    .then(fileText => this.controller.processMailTemplate(fileText))
                    .then(() => uiHelper.setStatusEmoji(options.status, "green"))
                    .catch(error => {
                        console.error(error);
                        uiHelper.setStatusEmoji(options.status, "red");
                    });
            });
    };

    private initWlanVoucherInput(elementId: string, getFromLocalStorage: Function, setLocalStorage: Function, description: string): void {
        const hotspotLabelInput = document.getElementById(elementId) as HTMLInputElement;
        hotspotLabelInput.value = getFromLocalStorage();

        hotspotLabelInput.addEventListener("input", event => {
            const inputElement = event.target as HTMLInputElement;
            console.log(`writing ${description} "${inputElement.value}" to local storage`);
            setLocalStorage(inputElement.value);
        })
    }

    initWlanVoucherUI(){
        console.log("Loading WLAN Voucher");
        this.initWlanVoucherInput("voucher_hotspot_label", this.controller.getWlanVoucherHotspotLabel, this.controller.setWlanVoucherHotspotLabel, "Hotspot Label")
        this.initWlanVoucherInput("voucher_duration_label", this.controller.getWlanVoucherDurationLabel, this.controller.setWlanVoucherDurationLabel, "Duration Label")
        this.initWlanVoucherInput("voucher_amount_label", this.controller.getWlanVoucherAmountLabel, this.controller.setWlanVoucherAmountLabel, "Amount Label")
        this.initWlanVoucherInput("voucher_print_label", this.controller.getWlanVoucherPrintLabel, this.controller.setWlanVoucherPrintLabel, "Print Label")
        this.initWlanVoucherInput("voucher_comment_label", this.controller.getWlanVoucherCommentLabel, this.controller.setWlanVoucherCommentLabel, "Comment Label")
    }
}