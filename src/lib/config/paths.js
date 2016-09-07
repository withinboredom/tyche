import os from 'os';
import fs from 'fs';
import path from 'path';

/**
 * Get's the path to the db
 * @returns {string} The path
 */
const dbFile = path.normalize(`${os.homedir()}/.tyche.json`);

function walkToPackage(dir = path.normalize(`${process.cwd()}/package.json`)) {
    try {
        fs.accessSync(dir, fs.F_OK)
        return path.dirname(dir);
    }
    catch (e) {
        return walkToPackage(path.normalize(`../${dir}`));
    }
}

function configPath() {
    return path.normalize(walkToPackage());
}

async function repoName() {
    return path.basename(configPath());
}

async function dbPrefix() {
    return `${await repoName()}_`;
}

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
