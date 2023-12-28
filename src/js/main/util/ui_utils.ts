
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
    }
};

export default {
    hideLoadingOverlay: () => utils.setLoadingOverlayVisible(false),
    showLoadingOverlay: () => utils.setLoadingOverlayVisible(true),
    getHtmlInputElement: (id: string) => document.getElementById(id) as HTMLInputElement,
    getHtmlSelectElement: (id: string) => document.getElementById(id) as HTMLSelectElement,
    hideContent: () => utils.setContentVisible(false),
    showContent: () => utils.setContentVisible(true)
};