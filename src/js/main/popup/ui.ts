import uiHelper from "./ui_helper";
import PopupController from "./controller";

export default class UI {
    private controller: PopupController;

    initMinimizeButton (button: HTMLElement) {
        button.addEventListener("click", event => {
            uiHelper.hideContent();
            uiHelper.addCssClass(button, "hide");
            uiHelper.removeCssClass(document.getElementById("maximize"), "hide");
        });
    };

    initMaximizeButton (button: HTMLElement) {
        button.addEventListener('click', event => {
            uiHelper.showContent();
            uiHelper.addCssClass(button, "hide");
            uiHelper.removeCssClass(document.getElementById('minimize'), "hide");
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
}