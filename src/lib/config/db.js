import {dbFile, dbPrefix} from 'lib/config/paths';
import fs from 'fs';
import Loki, {Collection} from 'lokijs';

/**
 * Initialize the db, uses side effects
 */
async function init() {
    const dbExists = await new Promise(done => {
        fs.exists(dbFile, exists => {
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
    return new Loki(dbFile);
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

/**
 * Get a files collection from the db
 * @param {loki} database the database
 * @returns {Collection} Collection
 */
export async function getFilesCollection(database) {
    const prefix = await dbPrefix();

    return database.getCollection(`${prefix}files`) || database.addCollection(`${prefix}files`, {
        unique: ['file']
    });
}

/**
 * Get the status collection
 * @param {loki} database The database
 * @returns {Collection} collection
 */
export async function getStatusCollection(database) {
    const prefix = await dbPrefix();

    return database.getCollection(`${prefix}status`) || database.addCollection(`${prefix}status`, {
        unique: ['task']
    });
}

export default load;
