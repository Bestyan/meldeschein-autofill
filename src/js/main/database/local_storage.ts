import { Template } from "../mail_template/mail_templater";
import constants from "../util/constants";

const localStorage = window.localStorage;

export default {

    addMailTemplateToLocalStorage(template: Template): void {
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
    },

    clearMailTemplates(): void {
        const localStorageKey = constants.localStorage.keys.mailTemplateNames;
        const storedNamesJson = window.localStorage.getItem(localStorageKey);
        if(storedNamesJson == null){
            return;
        }

        const names = JSON.parse(storedNamesJson) as Array<string>;
        names.forEach(templateName => localStorage.removeItem(templateName));
    }
}