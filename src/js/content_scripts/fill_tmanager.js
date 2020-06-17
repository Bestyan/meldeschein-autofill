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
        const radioAnreise = document.getElementById('gwt-uid-5');

        // Checkbox Buchung
        const checkboxBuchung = document.getElementById('gwt-uid-13');
        // Checkbox Eigenbelegung
        const checkboxEigenbelegung = document.getElementById('gwt-uid-20');

        // Anzahl Datensaetze
        const selects = document.getElementsByTagName('select');
        [...selects].forEach(
            select => {

                // skip if no textNode as first child
                if (select.parentNode.previousSibling == null ||
                    !select.parentNode.previousSibling.hasChildNodes() ||
                    !select.parentNode.previousSibling.childNodes[0].hasChildNodes() ||
                    select.parentNode.previousSibling.childNodes[0].childNodes[0].nodeType !== Node.TEXT_NODE) {

                    return;
                }
                const textNode = select.parentNode.previousSibling.childNodes[0].childNodes[0];
                if (textNode.nodeValue.includes('Anzahl Datensätze')) {
                    select.value = -1; // -1 = Alle
                }
            }
        );

        // this is not enough for the date fields. need to trigger them via datepicker as well.
        dateFields[0].value = ' ' + new Date(new Date().getFullYear(), 0, 1).toLocaleDateString("de-DE", DD_MM_YYYY);
        dateFields[1].value = ' ' + new Date(new Date().getFullYear(), 11, 31).toLocaleDateString("de-DE", DD_MM_YYYY);

        // this however is ok
        radioAnreise.checked = true;
        checkboxBuchung.checked = true;
        checkboxEigenbelegung.checked = true;

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
                [...buttons].forEach(
                    button => {
                        if (!button.textContent.includes('SUCHE STARTEN')) {
                            return;
                        }

                        button.click();
                    });
            });

    });