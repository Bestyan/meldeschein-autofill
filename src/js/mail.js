export default {
    generate: (data, isFirstVisit) => {
        let emlContent = `From: info@inzell-ferien.de
To: ${data.email}
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

${Buffer.from(`Hallo ${data.anrede} ${data.nachname},
es freut uns sehr, dass Sie bei uns waren und Sie sich wohl gefühlt haben.

Da inzwischen nahezu alle Interessenten vor der Wahl ihrer Unterkunft die Bewertungen in den Portalen lesen, ist es für uns existentiell, dass wir im Internet bewertet werden.
Deshalb habe ich Sie bei Abreise gebeten, ${isFirstVisit ? "" : "auch wenn Sie bereits bei uns zu Gast waren, " }für unser Haus eine kurze Bewertung abzugeben.

Für uns ist das unabhängige Bewertungsportal www.HolidayCheck.de entscheidend und wir würden uns freuen, wenn Sie hier Ihre Eindrücke von unserem Haus kurz schildern würden.
Einfach auf den Link gehen, Button „Bewerten“ und Apartmenthaus Sonnenschein eingeben und uns dann bewerten.

Um gefälschten Bewertungen vorzubeugen, wird Ihnen HolidayCheck nach Durchführung der Bewertung eine Mail zuschicken, in der Sie gebeten werden, diese zu bestätigen. Erst dann kann die Bewertung veröffentlicht werden.

Vielen Dank im Voraus und  Viele Grüße aus Inzell
Andrea und Jan Schattenberg

Apartmenthaus Sonnenschein
Lärchenstraße 13, 83334 Inzell
Tel. +49 152 0815 1901
e-mail: info@inzell-ferien.de
https://www.inzell-ferien.de`).toString('base64')}

------=_NextPart_000_001E_01D63BEF.79C9F730
Content-Type: text/html;charset="utf-8"
Content-Transfer-Encoding: base64

${Buffer.from(`<html>
<head>
<style>
p{
    font-family: Calibri, sans-serif;
    font-size: 11pt;
}
p.signature{
    font-size: 10.0pt;
    font-family: "Arial",sans-serif;
    color: black;
}
span#signature{
    color: #4472C4';
    font-weight: bold;
}
a#holidaycheck{
    color: #4472C4';
}
a#mailto, a#website{
    color: black;
}
</style>
</head>
<body>
<p>Hallo ${data.anrede} ${data.nachname},<br />
es freut uns sehr, dass Sie bei uns waren und Sie sich wohl gefühlt haben.</p>

<p>Da inzwischen nahezu alle Interessenten vor der Wahl ihrer Unterkunft die Bewertungen in den Portalen lesen, ist es für uns existentiell, dass wir im Internet bewertet werden.<br />
Deshalb habe ich Sie bei Abreise gebeten, ${isFirstVisit ? "" : "auch wenn Sie bereits bei uns zu Gast waren, " }für unser Haus eine kurze Bewertung abzugeben.</p>

<p>Für uns ist das unabhängige Bewertungsportal <a id="holidaycheck" href="https://www.holidaycheck.de" target="_blank">www.HolidayCheck.de</a> entscheidend und wir würden uns freuen, wenn Sie hier Ihre Eindrücke von unserem Haus kurz schildern würden.<br />
Einfach auf den Link gehen, Button „Bewerten“ und Apartmenthaus Sonnenschein eingeben und uns dann bewerten.</p>

<p>Um gefälschten Bewertungen vorzubeugen, wird Ihnen HolidayCheck nach Durchführung der Bewertung eine Mail zuschicken, in der Sie gebeten werden, diese zu bestätigen. Erst dann kann die Bewertung veröffentlicht werden.</p>

<p>Vielen Dank im Voraus und Viele Grüße aus Inzell<br />
Andrea und Jan Schattenberg</p>

<p class="signature"><span id="signature">Apartmenthaus Sonnenschein</span><br />
Lärchenstraße 13, 83334 Inzell<br />
Tel. +49 152 0815 1901<br />
e-mail: <a id="mailto" href="mailto:info@inzell-ferien.de">info@inzell-ferien.de</a><br />
<a id="website" href="https://www.inzell-ferien.de">www.inzell-ferien.de</a></p>
</body></html>`).toString('base64')}

------=_NextPart_000_001E_01D63BEF.79C9F730--`;


        let textFile = null,
            makeTextFile = function (text) {
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
        console.log(link.href);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};