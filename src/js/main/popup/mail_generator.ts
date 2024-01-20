import { Buffer } from "buffer";

const getEmailText = (data: { vorname: string, nachname: string, anrede: string, email: string }, 
    pronomen: "Du" | "Sie", isFirstVisit: boolean) => {
        return "";
};

export default {
    generate: (data: any, pronomen: "Du" | "Sie", isFirstVisit: boolean) => {
        const emlContent = getEmailText(data, pronomen, isFirstVisit);

        let textFile: any = null,
            makeTextFile = function (text: any) {
                let data = new Blob([text], {
                    type: 'text/plain;charset=iso-8859-1'
                });

                if (textFile !== null) {
                    window.URL.revokeObjectURL(textFile);
                }

                textFile = window.URL.createObjectURL(data);

                return textFile;
            };


        let link = document.createElement('a');
        link.href = makeTextFile(emlContent);
        link.download = "bewertung.eml";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};