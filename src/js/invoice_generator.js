import constants from './constants';
import XLSX from 'xlsx';

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
            const xlsxBinaryString = window.localStorage.getItem(constants.SETTINGS_INVOICE_XLSX);
            if (xlsxBinaryString === null) {
                reject("Rechnungstemplate fehlt. Bitte in Einstellungen hochladen.");
                return;
            }
            try {
                const workbook = XLSX.read(xlsxBinaryString, { type: 'binary', cellStyles: true });
                let sheet = workbook.Sheets[workbook.SheetNames[0]];
                console.log(sheet);
                XLSX.writeFile(workbook, "output.xlsx", { bookType: 'xlsx' });
            } catch (error) {
                console.log(error);
            }

        });
    }
};