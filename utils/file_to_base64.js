
const fs = require('fs');
const path = require('path');

const file = fs.readFileSync(path.resolve(__dirname, "../check_in_doc.docx"), { encoding: "base64" });

fs.writeFileSync("docx_as_base64.txt", file);
