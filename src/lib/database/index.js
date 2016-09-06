/**
 * This is a wrapper around loki.
 */

import {pathExists, dbPrefix} from '../config/paths';
import promisify from 'promisify-node';
import Loki from 'lokijs';
import {hashFile} from '../config/hash';

/**
 * A pleasant wrapper around the loki database
 */
export default class TycheDb {
    constructor(dbFile) {
        this.dbFile = dbFile;
        this.__db = null;
        this.__prefix = null;
        this._fileCache = {};
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

    get buildNumber() {
        const collection = this._getCollection('builds');
        let current = collection.max('build_number');
        if (current === -Infinity) { // seriously?
            current = 0;
        }

        return current;
    }

    set buildNumber(number) {
        const collection = this._getCollection('builds');
        collection.insert({build_number: number});
    }


    /**
     * Get's a named collection from loki
     * @param {string} name The name of the collection to get
     * @return {Collection} The collection
     * @private
     */
    _getCollection(name) {
        return this.__db.getCollection(`${this.__prefix}_${name}`) || this.__db.addCollection(`${this.__prefix}_${name}`);
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
     * Just creates a db object
     * @private
     */
    _createDb() {
        this.__db = new Loki(this.dbFile);
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

        this._createDb();

        await new Promise((done, reject) => {
            this.__db.loadDatabase({}, err => {
                if (err) {
                    return reject(err);
                }
                done();
            });
        });
    }

    async fileChanged(filename) {
        const hash = await hashFile(filename);
        const files = this._getCollection('files');
        const results = files.find({path: hash.file});

        if (this._fileCache[filename] !== undefined) {
            return this._fileCache[filename];
        }

        if (results.length === 0) {
            files.insert({path: hash.file, digest: hash.digest});
            this._fileCache[filename] = true;
            return true;
        }

        if (results[0].digest != hash.digest) {
            this._fileCache[filename] = true;
            results[0].digest = hash.digest;
            files.update(results[0]);
            return true;
        }

        this._fileCache[filename] = false;
        return false;
    }

    /**
     * Close the db
     */
    finish() {
        const db = this.__db;
        this.__db = undefined;
        return new Promise((done) => {
            db.saveDatabase(() => {
                done();
            });
        });
    }
}
