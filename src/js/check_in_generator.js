
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import constants from './constants';

const EMPTY_TEMPLATE_DATA = {
    apartment: "__________________",
    aufenthaltszeit: "_______________________________",
    name1: "_________________________________________________________",
    name2: "_________________________________________________________",
    name3: "_________________________________________________________",
    name4: "_________________________________________________________",
    name5: "_________________________________________________________"
}

export default {
    generate(placeholderData) {
        return new Promise((resolve, reject) => {

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
                if(templateData){
                    // if there's less than 5 people, fill the rest with underscores
                    for(let i = 1; i <= 5; i++){
                        if(!templateData[`name${i}`]){
                            templateData[`name${i}`] = EMPTY_TEMPLATE_DATA[`name${i}`];
                        }
                    }
                } else{
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

        })
    }
};