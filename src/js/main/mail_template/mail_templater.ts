import constants from "../util/constants";
import dataUtil from "../util/data_util";
import { Booking } from "../database/guest_excel";
import LocalStorage from "../database/local_storage";

const TEMPLATE_NAME = "name:"
const TEMPLATE_START = "--- start template ---";
const TEMPLATE_END = "--- end template ---";
const PLAINTEXT_START = "--- start plaintext ---";
const PLAINTEXT_END = "--- end plaintext ---";
const HTMLTEXT_START = "--- start htmltext ---";
const HTMLTEXT_END = "--- end htmltext ---";

const MAIL_FRAMES = [
    `From: info@inzell-ferien.de
To: {{ email }}
Subject: Bitte um Bewertung
MIME-Version: 1.0
Content-Type: multipart/alternative;
    boundary="----=_NextPart_000_001E_01D63BEF.79C9F730"
X-Unsent: 1
Content-Language: de

This is a multipart message in MIME format.

------=_NextPart_000_001E_01D63BEF.79C9F730
Content-Type: text/plain;charset="utf-8"
Content-Transfer-Encoding: base64

`,
    `

------=_NextPart_000_001E_01D63BEF.79C9F730
Content-Type: text/html;charset="utf-8"
Content-Transfer-Encoding: base64

`,
    `

------=_NextPart_000_001E_01D63BEF.79C9F730--`
];

export class Template {
    name: string;
    plaintext: string;
    htmltext: string;

    constructor(raw: string) {
        this.name = this.extractName(raw);
        this.plaintext = this.extractPlaintext(raw);
        this.htmltext = this.extractHtmltext(raw);
        console.log(`created new template ${this.name}`);
    }

    extractName(raw: string): string {
        const header = raw.substring(0, raw.indexOf(PLAINTEXT_START)).trim();
        // template header should contain nothing but "name: my-template"
        return header.substring(header.indexOf(TEMPLATE_NAME) + TEMPLATE_NAME.length).trim();
    }

    extractPlaintext(raw: string): string {
        return dataUtil.getStringBetween(raw, PLAINTEXT_START, PLAINTEXT_END).trim();
    }

    extractHtmltext(raw: string): string {
        return dataUtil.getStringBetween(raw, HTMLTEXT_START, HTMLTEXT_END).trim();
    }

    generateEncodedMailText(booking: Booking): string {
        const placeholderValues = {
            vorname: booking.organiserFirstname,
            nachname: booking.organiserLastname,
            anreise: booking.arrival,
            abreise: booking.departure,
            apartment: booking.apartment,
            email: booking.email
        };
        const mailStart = dataUtil.replacePlaceholders(MAIL_FRAMES[0], placeholderValues);
        const finalizedPlaintext = dataUtil.replacePlaceholders(this.plaintext, placeholderValues);
        const finalizedHtmltext = dataUtil.replacePlaceholders(this.htmltext, placeholderValues);

        return mailStart + dataUtil.base64Encode(finalizedPlaintext) + MAIL_FRAMES[1] + dataUtil.base64Encode(finalizedHtmltext) + MAIL_FRAMES[2];
    }
}

export default {
    processRawTemplate(rawTemplate: string): void {
        // split into one string per template
        const templateStrings = rawTemplate.split(TEMPLATE_START);
        // remove first element, which is either an empty string or user-written
        templateStrings.shift();
        templateStrings.map(templateString => {
            templateString = templateString.substring(0, templateString.indexOf(TEMPLATE_END)).trim();
            return new Template(templateString);
        }).forEach(template => {
            LocalStorage.addMailTemplateToLocalStorage(template);
        });
    }
}