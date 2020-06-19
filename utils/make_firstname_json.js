const XLSX = require('xlsx');
const fs = require('fs');

const OUTPUT_FILE_PATH = 'src/js/firstnames.json';
const INPUT_FILE_PATH = 'vornamen.xls';

console.log("reading xls");
let workbook = XLSX.readFile(INPUT_FILE_PATH);
let sheet = workbook.Sheets[workbook.SheetNames[0]];

console.log("adding header");
XLSX.utils.sheet_add_json(sheet, [{
    A: "gender",
    B: "name"
}], {
    skipHeader: true
});
let sheet_as_json = XLSX.utils.sheet_to_json(sheet);

console.log("cleaning data");
let clean_sheet_json = sheet_as_json.map(row => {
    row.name = row.name.trim();
    return row;
});

console.log(`saving to ${OUTPUT_FILE_PATH}`);
fs.writeFile(OUTPUT_FILE_PATH, JSON.stringify(clean_sheet_json), (err) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("saved.");
});