import crypto from 'crypto';
import fs from 'fs';

/**
 * Get's a hash from a file
 * @param {string} path The path of the file to hash
 * @returns {Promise} A promise that resolves to an object {file, hash}
 */
async function hashFile(path) {
    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(path);

    input.on('data', data => {
        hash.update(data);
    });

    const digest = await new Promise(done => {
        input.on('end', () => {
            const complete = hash.digest('hex');
            done({
                digest: complete,
                file: path
            });
        });
    });

    return digest;
}

/**
 * Get's an array of sha256 hashes given an array of files
 * @param {string[]} listOfFiles The files to hash
 * @returns {object[]} The array of hashes
 */
async function hashFileList(listOfFiles) {
    const list = [];
    for(const file of listOfFiles) {
        list.push(hashFile(file));
    }

    return await Promise.all(list);
}

export {hashFile, hashFileList};
