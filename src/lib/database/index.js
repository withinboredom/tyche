/**
 * This is a wrapper around loki.
 */

import {pathExists, dbPrefix} from '../config/paths';
import promisify from 'promisify-node';
import Loki from 'lokijs';

/**
 * A pleasant wrapper around the loki database
 */
export default class TycheDb {
    constructor(dbFile) {
        this.dbFile = dbFile;
        this.__db = null;
        this.__prefix = null;
    }

    /**
     * Get the raw loki db object
     * @return {null|Loki} This is null if this class hasn't been initialized yet
     */
    get db() {
        if (this.__db === null) {
            throw new Error('Database has not been initialized!');
        }

        return this.__db;
    }

    /**
     * Get the prefix for this repo
     * @return {string} The prefix
     */
    async dbPrefix() {
        if (this.__prefix === null) {
            this.__prefix = await dbPrefix();
        }

        return this.__prefix;
    }

    /**
     * Initialize the database
     */
    async initializeDb() {
        const exists = await pathExists(this.dbFile);
        if (!exists) {
            const fs = promisify('fs');
            try {
                await fs.writeFile(this.dbFile, '');
            } catch(err) {
                throw err;
            }
        }

        this.__db = new Loki();

        await new Promise((done, reject) => {
            this.db.loadDatabase({}, err => {
                if (err) {
                    return reject(err);
                }
                done();
            });
        });
    }
}
