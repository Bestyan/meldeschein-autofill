import XLSX from 'xlsx';

function handleFile(e) {
    let files = e.target.files,
        f = files[0];
    let reader = new FileReader();
    reader.onload = e => {
        let data = new Uint8Array(e.target.result);
        let workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true
        });

        /* DO SOMETHING WITH workbook HERE */
        //let sheet = workbook.Sheets[0]; //not sure this works
        let sheet = workbook.Sheets[workbook.SheetNames[0]];
        let sheet_as_json = XLSX.utils.sheet_to_json(sheet);
        console.log(sheet_as_json);
    };
    reader.readAsArrayBuffer(f);
}

document.getElementById('upload').addEventListener('change', handleFile, false);