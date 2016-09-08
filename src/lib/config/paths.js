import os from 'os';
import fs from 'fs';
import path from 'path';
import Logger from 'lib/logger';

const Log = Logger.child({
    component: 'Paths'
});

/**
 * Get's the path to the db
 * @returns {string} The path
 */
const dbFile = path.normalize(`${os.homedir()}/.tyche.json`);

/**
 * Walks up the directory tree until it finds a package.json
 * @param {string} dir The directory to start at
 * @default dir The current working directory
 * @return {string}
 */
function walkToPackage(dir = path.normalize(`${process.cwd()}/package.json`)) {
    try {
        fs.accessSync(dir, fs.F_OK);
        Log.info('Found package.json at:', dir);
        return path.dirname(dir);
    }
    catch (e) {
        return walkToPackage(path.normalize(`../${dir}`));
    }
}

/**
 * Returns the configuration path, where a tyche.json file should live
 * @return {string}
 */
function configPath() {
    return path.normalize(walkToPackage());
}

/**
 * Get the current name of this project, based on path name
 * @return {string}
 */
function repoName() {
    return path.basename(configPath());
}

/**
 * Get the database prefix
 * @return {string}
 */
function dbPrefix() {
    return `${repoName()}_`;
}

/**
 * Determine if a given path exists
 * @param {string} path A path to check
 * @return {Promise}
 */
function pathExists(path) {
    return new Promise((done, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    done(false);
                }
                //console.error(err);
                reject(err);
            }
            if (stats) {
                done(true);
            }

            done(false);
        });
    });
}

export {dbFile, configPath, repoName, dbPrefix, pathExists};
