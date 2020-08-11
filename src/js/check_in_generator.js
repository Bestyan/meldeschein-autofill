
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import constants from './constants';

const EMPTY_TEMPLATE = {
    apartment: "__________________",
    aufenthaltszeit: "_______________________________",
    name1: "_________________________________________________________",
    name2: "_________________________________________________________"
}

export default {
    generate() {
        return new Promise((resolve, reject) => {

            // load base64 encoded docx from local storage
            const docxBinaryString = window.localStorage.getItem(constants.SETTINGS_CHECKIN_DOCX);
            if (docxBinaryString === null) {
                reject("Check-in Dokument fehlt. Bitte in Einstellungen hochladen.");
                return;
            }

            // replace placeholders
            const zip = new PizZip().load(docxBinaryString);
            try {
                const docx = new Docxtemplater(zip);
                // replace placeholders
                docx.setData(EMPTY_TEMPLATE);
                docx.render();
                const docxBlob = docx.getZip().generate({
                    type: "blob",
                    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                });

                // download the created docx
                const docxUrl = window.URL.createObjectURL(docxBlob);
                const link = document.createElement('a');
                link.href = docxUrl;
                link.download = `check_in_NAME`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(docxUrl);
                
                resolve();
            } catch (error) {
                reject(error);
                return;
            }

        })
    }
};