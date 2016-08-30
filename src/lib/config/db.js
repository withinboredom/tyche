import {dbFile, dbPrefix} from 'lib/config/paths';
import fs from 'fs';
import Loki, {Collection} from 'lokijs';

/**
 * Initialize the db, uses side effects
 */
async function init() {
    const dbExists = await new Promise((done, reject) => {
        fs.stat(dbFile, (err, stats) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    done(false);
                }
                console.error(err);
                reject(err);
            }
            if (stats) {
                done(true);
            }

            done(false);
        });
    });

    if (!dbExists) {
        await new Promise((done, reject) => {
            fs.writeFile(dbFile, '', err => {
                if (err){
                    reject(err);
                }
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
    await new Promise((done, reject) => {
        db.loadDatabase({}, (err) => {
            if (err) {
                reject(err);
            }
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

export async function getHasRunCollection(database) {
    const prefix = await dbPrefix();
    return database.getCollection(`${prefix}hasRun`) || database.addCollection(`${prefix}hasRun`, {
        unique: ['task']
    });
}

export default load;
