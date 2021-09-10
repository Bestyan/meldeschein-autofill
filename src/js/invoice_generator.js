import constants from './constants';
import exceljs from 'exceljs';

export default {
    /**
     * generate invoice
     * @param {{
     * anreise: string, 
     * abreise: string
     * }} placeholders 
     * @returns 
     */
    generate(placeholders) {

        return new Promise((resolve, reject) => {
            const xlsxBuffer = window.localStorage.getItem(constants.SETTINGS_INVOICE_XLSX);
            if (xlsxBuffer === null) {
                reject("Rechnungstemplate fehlt. Bitte in Einstellungen hochladen.");
                return;
            }
            try {
                const workbook = new exceljs.Workbook();
                console.log(xlsxBuffer);
                workbook.xlsx.load(xlsxBuffer, { base64: true })
                    .then(() => {
                        const json = JSON.stringify(workbook.model);
                        console.log(json); // the json object

                        return workbook.xlsx.writeBuffer();
                    })
                    .then(blob => {
                        const xlsxBlob = new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

                        // download the created xlsx
                        const invoiceUrl = window.URL.createObjectURL(xlsxBlob);
                        const link = document.createElement('a');
                        link.href = invoiceUrl;
                        link.download = "rechnung.xlsx";//`rechnung_${placeholders ? `${placeholders.name1.slice(placeholders.name1.lastIndexOf(' ') + 1)}_${placeholders.apartment}` : "leer"}`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(invoiceUrl);
                    })
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