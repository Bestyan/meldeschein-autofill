const ZIP_FILE_PATH = 'meldeschein-autofill.zip';

const archiver = require('archiver');
const fs = require('fs');
/**
 * @param {String} source
 * @param {String} out
 * @returns {Promise}
 */
function zipDirectory(source, out) {
    console.log("zipping build");
    const archive = archiver('zip', {
        zlib: {
            level: 9
        }
    });
    const stream = fs.createWriteStream(out);

    return new Promise((resolve, reject) => {
        archive
            .directory(source, false)
            .on('error', err => reject(err))
            .pipe(stream);

        stream.on('close', () => resolve());
        archive.finalize();
    });
}

(async () => {
    await zipDirectory('build', ZIP_FILE_PATH)
        .catch(error => console.log(error));
})();