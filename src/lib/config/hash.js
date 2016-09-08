/**
 * Hash files and list of files
 * @module lib/config/hash
 */
import crypto from 'crypto';
import fs from 'fs';
import Logger from 'lib/logger';

const Log = Logger.child({
    component: 'Hash'
});

/**
 * Get's a hash from a file
 * @param {string} path The path of the file to hash
 * @returns {Promise} A promise that resolves to an object {file, hash}
 * @async
 */
function hashFile(path) {
    return new Promise((done, reject) => {
        const hash = crypto.createHash('sha256');
        const input = fs.createReadStream(path);

        input.on('error', (err) => {
            reject(err);
        });

        input.on('data', data => {
            try {
                hash.update(data);
            }
            catch(err) {
                reject(err);
            }
        });

        input.on('end', () => {
            try {
                const complete = hash.digest('hex');
                done({
                    digest: complete,
                    file: path
                });
            } catch (err) {
                reject(err);
            }
        });
    })
}

/**
 * Get's an array of sha256 hashes given an array of files
 * @param {array} listOfFiles The files to hash
 * @returns {Promise} The array of hashes
 */
function hashFileList(listOfFiles) {
    return Promise.all(listOfFiles.map((file) => hashFile(file).catch((err) => Log.error(`${err}`))));
}

export {
    hashFile,
    hashFileList
};
