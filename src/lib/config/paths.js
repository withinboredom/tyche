import fs from 'fs';
import os from 'os';
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

export {dbFile, configPath, repoName, dbPrefix};
