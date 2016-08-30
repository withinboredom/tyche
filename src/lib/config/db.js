import path from 'path';
import os from 'os';
import fs from 'fs';
import loki from 'lokijs';

/**
 * The path to the global database file
 * @type {string}
 */
const dbFile = path.normalize(`${os.homedir()}/.tyche.json`);

/**
 * Initialize the db, uses side effects
 */
async function init() {
    const dbExists = await new Promise((done) => {
        fs.exists(dbFile, (exists) => {
            done(exists);
        });
    });

    if (!dbExists) {
        await new Promise(done => {
            fs.writeFile(dbFile, '', () => {
                done();
            });
        });
    }
}

/**
 * Initializes the db instance
 * @returns {loki} The db instance
 */
async function dbCreate() {
    await init();
    return new loki(dbFile);
}

/**
 * Loads the db from the filesystem and returns it for use
 * @returns {loki} The database
 */
async function load() {
    const db = await dbCreate();
    await new Promise(done => {
        db.loadDatabase({}, () => {
            done();
        });
    });
    return db;
}

export default load();
