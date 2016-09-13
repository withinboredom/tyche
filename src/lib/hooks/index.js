/**
 * @module lib/hooks
 */

import path from 'path';
import fs from 'fs';
import Logger from 'lib/logger';

const Log = Logger.child({
    component: 'HookManager'
});

class HookManager {
    constructor(repoRoot) {
        this.path = path.normalize(path.join(repoRoot, '/.git/hooks'));
        this.HOOK_VERSION = null;
    }

    _pathToHook(hook) {
        return path.join(this.path, hook);
    }

    hasHook(hook) {
        Log.trace(`Looking for hook: ${hook}`);
        try {
            fs.accessSync(this._pathToHook(hook));
            Log.trace(`${hook} is set`);
            return true;
        }
        catch (e) {
            return false;
        }
    }

    _readLines(file, numLines = 1, start = 0) {
        return new Promise((done, reject) => {
            const stream = fs.createReadStream(file, {
                flags: 'r',
                encoding: 'utf8',
                fd: null,
                mode: 666,
                bufferSize: 64 * 1024
            });

            let fileData = '';
            stream.on('data', (data) => {
                fileData += data;

                const lines = fileData.split("\n");
                if (lines.length > numLines - start) {
                    stream.resume();
                    done(lines.slice(start, numLines))
                }
            });

            stream.on('error', (err) => {
                reject(err);
            });

            stream.on('end', () => {
                const lines = fileData.split("\n");
                if (lines.length >= numLines - start) {
                    done(lines.slice(start, numLines));
                }
                reject(new Error('not enough lines'));
            })
        });
    }

    async _getHookFileVersion(file) {
        try {
            const lines = await this._readLines(file, 2);
            const version = lines[1].split('/*')[1].split('*/')[0];
            return JSON.parse(version);
        }
        catch(e) {
            Log.trace(`Failed to get version data from ${file} with error`);
            throw new Error('File is not a tyche hook file');
        }
    }

    async isTycheHook(hook) {
        if (this.hasHook(hook)) {
            try {
                const versionData = await this._getHookFileVersion(this._pathToHook(hook));
                this.HOOK_VERSION = versionData.HOOK_VERSION;
                return (this.HOOK_VERSION !== null);
            } catch(err) {
                Log.trace(`hook ${hook} is not a tyche hook`);
                Log.trace(`Got error ${err}`);
                return false;
            }
        }
        return false;
    }

    async _copyFile(source, target) {
        return new Promise(function(resolve, reject) {
            Log.trace(`Creating symlink from ${source} to ${target}`);
            fs.symlink(source, target, 'junction', (err) => {
                if (err) {
                    reject(err);
                }

                resolve();
            })
        });
    }

    async install(hook) {
        const source = `${path.normalize(path.dirname(__dirname))}/hook.js`;
        const target = this._pathToHook(hook);
        if(await this.isTycheHook(hook)) {
            //since the hook is already set, and a tyche hook, check it's version and replace it if different
            try {
                const currentVersion = await this._getHookFileVersion(source);
                const installedVersion = await this._getHookFileVersion(target);

                if (currentVersion.HOOK_VERSION !== installedVersion.HOOK_VERSION) {
                    // we need to update things
                    try {
                        this._copyFile(source, target);
                        return true;
                    }
                    catch(err) {
                        Log.error(`Failed to update ${hook} hook`);
                    }
                }

                // nothing to do
                return false;
            }
            catch(e) {
                // in theory, it should be impossible to get here, since, you know... we already did this try/catch in
                // this.isTycheHook() ... but just to be on the safe side ...
                Log.error(`Somehow, an impossible error has occurred. Please report this issue`);
                return false;
            }
        }

        // we are installing a brand new hook ...
        try {
            // check to make sure there's not already a hook installed, if so, copy it
            fs.accessSync(target);
            await this._copyFile(target, `${target}-original`);
        }
        catch(e) {
            Log.trace(`failed to copy ${target} to ${target}-original`);
        }
        try {
            await this._copyFile(source, target);
            return true;
        }
        catch(e) {
            Log.error(`failed to copy ${source} to ${target}`);
            return false;
        }
    }
}

export default HookManager;
