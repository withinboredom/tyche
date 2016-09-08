/**
 * This is a wrapper around loki.
 * @module lib/database
 */

import {pathExists, dbPrefix} from '../config/paths';
import promisify from 'promisify-node';
import Loki from 'lokijs';
import {hashFile} from '../config/hash';
import Logger from 'lib/logger';

const Log = Logger.child({
    component: 'TycheDb'
});

/**
 * A pleasant wrapper around the loki database
 * @class
 */
class TycheDb {
    /**
     * Create a database wrapper
     * @param {string} dbFile
     */
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
        if (this.__db === null || this.__db === undefined) {
            Log.fatal('Unable to initialize the database');
            throw new Error('Database has not been initialized!');
        }
        Log.trace('Got raw db');
        return this.__db;
    }

    /**
     * Get the current build number
     * @return {number}
     */
    get buildNumber() {
        const collection = this._getCollection('builds');
        let current = collection.maxRecord('build_number').value;
        if (current === -Infinity || current === null || current === undefined) { // seriously?
            current = 0;
        }

        Log.trace(`Got build #${current}`);

        return current;
    }

    /**
     * Set the current build number
     * @param {number} number The new build number
     */
    set buildNumber(number) {
        const collection = this._getCollection('builds');
        const current = collection.get(collection.maxRecord('build_number').index);
        Log.trace(`Updating build number to #${number}`);
        if (current === null || current === undefined) {
            Log.trace('Inserting new build number record');
            collection.insert({build_number: number});
            return;
        }
        Log.trace('Updating existing build number');
        current.build_number = number;
        collection.update(current);
        Log.trace('done updating build number');
    }


    /**
     * Get's a named collection from loki
     * @param {string} name The name of the collection to get
     * @return {Collection} The collection
     * @private
     */
    _getCollection(name) {
        Log.trace(`Got collection with name ${this.dbPrefix()}_${name}`);
        return this.db.getCollection(`${this.dbPrefix()}_${name}`) || this.db.addCollection(`${this.dbPrefix()}_${name}`);
    }

    /**
     * Get the prefix for this repo
     * @return {string} The prefix
     */
    dbPrefix() {
        if (this.__prefix === null) {
            this.__prefix = dbPrefix();
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
     * @return {Promise}
     */
    async initializeDb() {
        const exists = await pathExists(this.dbFile);
        if (!exists) {
            const fs = promisify('fs');
            try {
                Log.trace('Creating empty db file');
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
                Log.trace('fully initialized db');
                done();
            });
        });
    }

    /**
     * Updates the snapshot (digest) of a file in the db
     * @param {string} filename
     * @return {Promise}
     */
    async updateFileSnapshot(filename) {
        Log.trace(`Updating file snapshot for ${filename}`);
        if (await this.fileChanged(filename)) {
            Log.trace(`Looks like ${filename} has changed...`);
            // don't update it if it hasn't changed?
            const {hash, files} = await this._getHashAndCollectionFor(filename);

            const results = files.find({path: hash.file});

            if (results.length === 0) {
                Log.trace(`Didn't find ${filename} in the db, so inserting it with digest ${hash.digest}`);
                files.insert({
                    path: hash.file,
                    digest: hash.digest
                });
            }
            else {
                Log.trace(`Updating ${filename} with digest ${hash.digest}`);
                results[0].digest = hash.digest;
                files.update(results[0]);
            }
        }
    }

    /**
     * Gets a collection and a hash
     * @param {string} filename
     * @return {{hash: {path: {string}, digest: {string}}, files: Collection}}
     * @private
     */
    async _getHashAndCollectionFor(filename) {
        const hash = await hashFile(filename);
        const files = this._getCollection('files');
        //noinspection JSValidateTypes
        return {hash, files};
    }

    /**
     * Determines if a file changed or not
     * @param {string} filename
     * @return {boolean}
     */
    async fileChanged(filename) {
        Log.trace(`Checking ${filename} for changes`);
        if (this._fileCache[filename] !== undefined) {
            Log.trace(`Got result ${this._fileCache[filename]} for ${filename} from cache`);
            return this._fileCache[filename];
        }

        Log.trace(`Looking up ${filename} in db`);

        const {hash, files} = await this._getHashAndCollectionFor(filename);
        const results = files.find({path: hash.file});

        if (results.length === 0) {
            Log.trace(`Didn't find ${filename} in the db, so ${filename} must have changed?`);
            this._fileCache[filename] = true;
            return true;
        }

        if (results[0].digest != hash.digest) {
            Log.trace(`${results[0].digest} doesn't match ${hash.digest} so ${filename} changed.`);
            this._fileCache[filename] = true;
            return true;
        }

        Log.trace(`${filename} hasn't changed`);
        this._fileCache[filename] = false;
        return false;
    }

    /**
     * Close the db
     */
    finish() {
        Log.trace('Shutting down db');
        const db = this.__db;
        this.__db = undefined;
        return new Promise((done) => {
            db.saveDatabase(() => {
                Log.trace('Database shutdown and flushed to disk successfully');
                done();
            });
        });
    }
}

export default TycheDb;
