import os from 'os';
import fs from 'fs';
import path from 'path';
import { Repository } from 'nodegit';

/**
 * Get's the path to the db
 * @returns {string} The path
 */
const dbFile = path.normalize(`${os.homedir()}/.tyche.json`);

async function configPath() {
    const repo = await Repository.open(process.cwd());
    return path.normalize(`${repo.path()}/../`);
}

async function repoName() {
    return path.basename(await configPath());
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
