
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import constants from '../util/constants';
import { Booking, MeldescheinGroup, Guest } from "../database/guest_excel";
import dataUtil from '../util/data_util';

const EMPTY_TEMPLATE_DATA = {
    apartment: "__________________",
    aufenthaltszeit: "_______________________________",
    name1: "_________________________________________________________",
    name2: "_________________________________________________________",
    name3: "_________________________________________________________",
    name4: "_________________________________________________________",
    name5: "_________________________________________________________",
    nameTestpflicht1: "___________________________________",
    nameTestpflicht2: "___________________________________",
    nameTestpflicht3: "___________________________________",
    nameTestpflicht4: "___________________________________",
    nameTestpflicht5: "___________________________________",
    anreise: "_________",
    anzahlSchluessel: "_____",
    schluessel: "________________________________",
    testdatum2: "_________",
    testdatum3: "_________",
    testdatum4: "_________",
    testdatum5: "_________",
    testdatum6: "_________",
    testdatum7: "_________",
}

function generate(placeholderData: any) {
    return new Promise<void>((resolve, reject) => {

        // load base64 encoded docx from local storage
        const docxBinaryString = window.localStorage.getItem(constants.SETTINGS_CHECKIN_DOCX);
        if (docxBinaryString === null) {
            reject("Check-in Dokument fehlt. Bitte in Einstellungen hochladen.");
            return;
        }

        const zip = new PizZip().load(docxBinaryString);
        try {
            const docx = new Docxtemplater(zip);

            let templateData = placeholderData;
            if (templateData) {
                // if there's fewer than 5 people, fill the rest with underscores
                for (let i = 1; i <= 5; i++) {
                    if (!templateData[`name${i}`]) {
                        templateData[`name${i}`] = EMPTY_TEMPLATE_DATA[`name${i}` as keyof typeof EMPTY_TEMPLATE_DATA];
                    }
                }

                // if there's fewer than 5 people, fill the rest with underscores
                for (let i = 1; i <= 5; i++) {
                    if (!templateData[`nameTestpflicht${i}`]) {
                        templateData[`nameTestpflicht${i}`] = EMPTY_TEMPLATE_DATA[`nameTestpflicht${i}` as keyof typeof EMPTY_TEMPLATE_DATA];
                    }
                }

                // if there's fewer than 7 testDates, fill the rest with underscores 
                for (let i = 2; i <= 7; i++) {
                    if (!templateData[`testdatum${i}`]) {
                        templateData[`testdatum${i}`] = EMPTY_TEMPLATE_DATA[`testdatum${i}` as keyof typeof EMPTY_TEMPLATE_DATA];
                    }
                }

                // if there was an error with the keys, fill with blanks
                if (!templateData.anzahlSchluessel) {
                    templateData.anzahlSchluessel = EMPTY_TEMPLATE_DATA.anzahlSchluessel;
                    templateData.schluessel = EMPTY_TEMPLATE_DATA.schluessel;
                }

            } else {
                templateData = EMPTY_TEMPLATE_DATA;
            }

            // replace placeholders
            docx.setData(templateData);
            docx.render();
            const docxBlob = docx.getZip().generate({
                type: "blob",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            });

            // download the created docx
            const docxUrl = window.URL.createObjectURL(docxBlob);
            const link = document.createElement('a');
            link.href = docxUrl;
            link.download = `check_in_${placeholderData ? placeholderData.name1.slice(placeholderData.name1.lastIndexOf(' ') + 1) : "leer"}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(docxUrl);

            resolve();
        } catch (error) {
            reject(error);
            return;
        }
    });
}

export default {
    generateDocument(booking: Booking, getApartmentKeyNames: Function) {
        // create placeholder mappings from selected table row. if no row is selected, blank lines will be generated instead
        let placeholderData: any = null;
        const arrivalString = dataUtil.formatDate(booking.arrival);
        const departureString = dataUtil.formatDate(booking.departure)
        if (booking != null) {
            placeholderData = {
                apartment: booking.apartment,
                aufenthaltszeit: `${arrivalString} ‒ ${departureString}`,
                anreise: arrivalString,
            };

            // name placeholders are name1, name2, name3 etc
            const guests = booking.meldescheinGroups.flatMap((group: MeldescheinGroup) => group.guests)
            guests.forEach((guest: Guest, index: number) => {
                placeholderData[`name${index + 1}`] = `${guest.firstname} ${guest.lastname}`;
            })
            // if no names have been found, only the name of the person who booked will appear as name1
            if (guests.length === 0) {
                placeholderData.name1 = `${booking.organiserFirstname} ${booking.organiserLastname}`;
            }

            // placeholders schluessel and anzahlSchluessel
            const numberOfKeys = dataUtil.getNumberOfKeys(guests.map(guest => guest.birthdate), booking.arrival);
            if (numberOfKeys > 0) {
                const keys = getApartmentKeyNames(booking.apartment, numberOfKeys).join(", ");
                placeholderData.anzahlSchluessel = numberOfKeys;
                placeholderData.schluessel = keys;
            }
        }

        generate(placeholderData)
            .then(() => console.log("checkin docx generated"))
            .catch(error => alert(error));
    }
};