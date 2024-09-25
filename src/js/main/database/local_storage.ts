import { Template } from "../mail_template/mail_templater";
import constants from "../util/constants";

const localStorage = window.localStorage;

export default class LocalStorage {

    static setGuestExcelDataUploadTime(): void {
        const uploadTime = new Date().toLocaleDateString('de-DE', constants.dateFormat.dateAndTime.format);
        localStorage.setItem(constants.localStorage.keys.guestExcelUploadTime, uploadTime);
    };

    static getGuestExcelDataUploadTime(): string {
        return localStorage.getItem(constants.localStorage.keys.guestExcelUploadTime);
    }

    static addMailTemplateToLocalStorage(template: Template): void {
        const localStorageKey = constants.localStorage.keys.mailTemplateNames;
        const storedNamesJson = window.localStorage.getItem(localStorageKey);
        let names: Array<string>;
        if (storedNamesJson == null) {
            names = [template.name];
        } else {
            names = JSON.parse(storedNamesJson) as Array<string>;
            names.push(template.name);
        }
        window.localStorage.setItem(localStorageKey, JSON.stringify(names));
        window.localStorage.setItem(template.name, JSON.stringify(template));
    };

    static clearMailTemplates(): void {
        const names = this.getMailTemplateNames() as Array<string>;
        names.forEach(templateName => localStorage.removeItem(templateName));
        localStorage.removeItem(constants.localStorage.keys.mailTemplateNames);
    };

    static getMailTemplateNames(): Array<string> {
        const localStorageKey = constants.localStorage.keys.mailTemplateNames;
        const storedNamesJson = window.localStorage.getItem(localStorageKey);
        if (storedNamesJson == null) {
            return [];
        }

        return JSON.parse(storedNamesJson) as Array<string>;
    };

    static getMailTemplate(templateName: string): Template {
        const templateJson = localStorage.getItem(templateName);
        return JSON.parse(templateJson) as Template;
    }

    static getMailTemplateByIndex(index: number): Template {
        const templateNames = LocalStorage.getMailTemplateNames();
        if (templateNames.length < index + 1) {
            alert(`Template für index ${index} nicht vorhanden.`);
            return null;
        }

        const templateName = templateNames[index];
        return LocalStorage.getMailTemplate(templateName);
    };

    static getWlanVoucherHotspotLabel(): string {
        return localStorage.getItem(constants.localStorage.keys.wlanVoucher.labels.hotspot);
    }

    static setWlanVoucherHotspotLabel(label: string): void {
        localStorage.setItem(constants.localStorage.keys.wlanVoucher.labels.hotspot, label);
    }

    static getWlanVoucherDurationLabel(): string {
        return localStorage.getItem(constants.localStorage.keys.wlanVoucher.labels.duration);
    }

    static setWlanVoucherDurationLabel(label: string): void {
        localStorage.setItem(constants.localStorage.keys.wlanVoucher.labels.duration, label);
    }

    static getWlanVoucherAmountLabel(): string {
        return localStorage.getItem(constants.localStorage.keys.wlanVoucher.labels.amount);
    }

    static setWlanVoucherAmountLabel(label: string): void {
        localStorage.setItem(constants.localStorage.keys.wlanVoucher.labels.amount, label);
    }

    static getWlanVoucherPrintLabel(): string {
        return localStorage.getItem(constants.localStorage.keys.wlanVoucher.labels.print);
    }

    static setWlanVoucherPrintLabel(label: string): void {
        localStorage.setItem(constants.localStorage.keys.wlanVoucher.labels.print, label);
    }

    static getWlanVoucherCommentLabel(): string {
        return localStorage.getItem(constants.localStorage.keys.wlanVoucher.labels.comment);
    }

    static setWlanVoucherCommentLabel(label: string): void {
        localStorage.setItem(constants.localStorage.keys.wlanVoucher.labels.comment, label);
    }
}