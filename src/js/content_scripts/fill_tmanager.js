console.log('fill_tmanager loaded');

const DD_MM_YYYY = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
};

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        console.log("message received");
        // von bis
        const dateFields = document.getElementsByClassName('tm-ProcessV2-Text-Datefield-Bold');
        // Radio Anreise
        const radioAbreise = document.getElementById('gwt-uid-6');

        // Checkbox Buchung
        const checkboxBuchung = document.getElementById('gwt-uid-13');
        // Checkbox Eigenbelegung
        const checkboxEigenbelegung = document.getElementById('gwt-uid-20');

        // Anzahl Datensaetze
        const selects = document.getElementsByTagName('select');
        [...selects]
            .filter((_) => {
                // skip if no textNode as first child
                return _.parentNode.previousSibling
                && _.parentNode.previousSibling.hasChildNodes()
                && _.parentNode.previousSibling.childNodes[0].hasChildNodes()
                && _.parentNode.previousSibling.childNodes[0].childNodes[0].nodeType === Node.TEXT_NODE
                && _.parentNode.previousSibling.childNodes[0].childNodes[0].nodeValue.includes('Anzahl Datensätze');
            }).forEach(
            select => {
                select.value = -1; // -1 = Alle
                const changeEvent = document.createEvent("HTMLEvents");
                changeEvent.initEvent("change", false, true);
                select.dispatchEvent(changeEvent);
            }
        );

        // weird jsp mechanics require everything to be clicked in order to register
        if(!radioAbreise.checked){
            radioAbreise.click();
        }
        if(!checkboxBuchung.checked){
            checkboxBuchung.click();
        }
        if(!checkboxEigenbelegung.checked){
            checkboxEigenbelegung.click();
        }

        // this is not enough for the date fields. need to trigger them via datepicker as well.
        dateFields[0].value = new Date(new Date().getFullYear(), 0, 1).toLocaleDateString("de-DE", DD_MM_YYYY);
        dateFields[1].value = new Date(new Date().getFullYear(), 11, 31).toLocaleDateString("de-DE", DD_MM_YYYY);


        // picking dates via datepicker because weird jsp stuff doesn't recognize the set values
        const datepickers = document.getElementsByClassName('tm-handCursor');
        const sleepTime = 200;

        // click on first datepicker
        [...datepickers][0].click();
        new Promise(r => setTimeout(r, sleepTime))
            .then(() => {
                let calendarDays = document.getElementsByClassName('gwt-HTML');
                // click on [Jan] 1
                [...calendarDays][1].click();
                return new Promise(r => setTimeout(r, sleepTime));
            })
            .then(() => {
                // click on second datepicker
                [...datepickers][1].click();
                return new Promise(r => setTimeout(r, sleepTime));
            })
            .then(() => {
                let calendarDays = document.getElementsByClassName('gwt-HTML');
                // click on [Dec] 31
                [...calendarDays][31].click();
                return new Promise(r => setTimeout(r, sleepTime));
            })
            .then(() => {
                // Suche starten
                const buttons = document.getElementsByClassName('tm-Component-Button-Save-Background');
                [...buttons].filter(_ => _.textContent.includes('SUCHE STARTEN')).forEach(button => button.click());
            });
    }
);
