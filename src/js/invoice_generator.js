import constants from './constants';
import exceljs from 'exceljs';
import data_utils from './data_utils';

const invoiceUtils = {
    /**
     * offer the blob as an .xlsx file for download in the browser
     * @param {Blob} blob 
     */
    downloadXlsx: (blob, tmanagerRow) => {
        const xlsxBlob = new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

        // download the created xlsx
        const invoiceUrl = window.URL.createObjectURL(xlsxBlob);
        const link = document.createElement('a');
        link.href = invoiceUrl;

        // set default filename: rechnung_nachname_apartment.xlsx (or rechnung_leer.xlsx if no row was selected)
        let filename = "rechnung_";
        if (tmanagerRow) {
            filename += `${tmanagerRow.nachname}_${tmanagerRow.apartment}.xlsx`;
        } else {
            filename += "leer.xlsx"
        }
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(invoiceUrl);
    },

    /**
     * 
     * @param {exceljs.Workbook} workbook 
     * @param {Object} row 
     * @param {Array<{name: string, birthdate: string}>} birthdates 
     */
    fillTemplate: (workbook, row, birthdates) => {
        // get the first worksheet
        const worksheet = workbook.worksheets[0];

        // set the name and adress
        // name
        worksheet.getCell("A11").value = `${row.vorname} ${row.nachname}`;
        // strasse
        worksheet.getCell("A12").value = row.strasse;
        // PLZ + ort
        worksheet.getCell("A13").value = `${row.plz} ${row.ort}`;
        // ggf. Land
        if (row.land !== "Deutschland" && row.land != null) {
            worksheet.getCell("A14").value = `${row.land}`;
        }

        // set invoice number to be the current year
        worksheet.getCell("B17").value = new Date().getFullYear();

        // aufenthalt
        worksheet.getCell("B20").value = `${row.anreise} - ${row.abreise}`;
        // apartment
        worksheet.getCell("B21").value = `${row.apartment}-Apartment`;

        // Rechnungsdatum
        worksheet.getCell("G17").value = row.abreise;

        // anzahl personen
        if (birthdates) {
            worksheet.getCell("A24").value = birthdates.length;
        } else {
            worksheet.getCell("A24").value = row.personen;
        }
        // anzahl naechte
        const numberOfNights = data_utils.getNumberOfNights(row.anreise, row.abreise);
        worksheet.getCell("C24").value = numberOfNights;

        // preis
        worksheet.getCell("G24").value = row.preis;

        // kurbeitrag
        if (birthdates) {
            // get kurbeitrag prices from local storage
            const { adults, children, toddlers } = JSON.parse(window.localStorage.getItem(constants.SETTINGS_KURBEITRAG));

            let kurbeitragFormula = "";
            birthdates.forEach(({ birthdate }) => {
                const age = data_utils.getAgeOnDate(birthdate, row.anreise);

                if (age >= 16) { //adults 16+

                    // replace . with , so German Excel can compute it
                    const kurbeitragComma = (adults + "").replace(".", ",");
                    kurbeitragFormula += `+C24*${kurbeitragComma}`;

                } else if (age <= 15 && age >= 6) { //children 6-15

                    const kurbeitragComma = (children + "").replace(".", ",");
                    kurbeitragFormula += `+C24*${kurbeitragComma}`;

                } else if (age <= 5) { // toddlers 0-5

                    const kurbeitragComma = (toddlers + "").replace(".", ",");
                    kurbeitragFormula += `+C24*${toddlers.toFixed(2)}`;

                }
            });
            kurbeitragFormula = kurbeitragFormula.slice(1);
            worksheet.getCell("G48").value = { formula: kurbeitragFormula };
        }


    }
}

export default {
    /**
     * generate invoice
     * @param {{
     * anreise: string, 
     * abreise: string
     * }} tmanagerRow 
     * @returns 
     */
    generate(tmanagerRow, birthdates) {

        return new Promise((resolve, reject) => {
            const xlsxBuffer = window.localStorage.getItem(constants.SETTINGS_INVOICE_XLSX);
            if (xlsxBuffer === null) {
                reject("Rechnungstemplate fehlt. Bitte in Einstellungen hochladen.");
                return;
            }
            try {
                const workbook = new exceljs.Workbook();
                workbook.xlsx.load(xlsxBuffer, { base64: true })
                    .then(() => {
                        // fill the template invoice with all the relevant data
                        if (tmanagerRow) {
                            invoiceUtils.fillTemplate(workbook, tmanagerRow, birthdates);
                        }

                        // convert workbook to binary blob
                        return workbook.xlsx.writeBuffer();
                    })
                    .then(blob => invoiceUtils.downloadXlsx(blob, tmanagerRow))
                    .catch(error => {
                        console.log(error);
                        alert(`Rechnung konnte nicht erstellt werden. ${error.toString()}`);
                    })

            } catch (error) {
                console.log(error);
                reject(error);
            }

        });
    }
};