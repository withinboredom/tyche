/**
 * @module lib/student
 */

import glob from 'glob';
import EventBus from 'lib/bus';
import Logger from 'lib/logger';

const Log = Logger.child({
    component: 'Student'
});

/**
 * Describe how to study
 */
class Student {

    /**
     * Creates a student to study this repo
     * @param {TycheDb} database A reference to a database
     * @param {object} definition The definition of the studies
     */
    constructor(database, definition) {
        this._database = database;
        this._definition = definition;
        this.triggers = [];
        this.globs = [];

        for(const study of definition) {
            if (study.on) {
                const trigger = {
                    on: study.on,
                    message: study.message,
                    actions: study.do,
                    armed: false,
                    watches: []
                };

                if (study.watch) {
                    for (const glob of study.watch) {
                        const watcher = this.globs.filter(e => e.path == glob);
                        if(watcher.length === 0) {
                            watcher.push({
                                path: glob,
                                triggers: [trigger]
                            });
                            this.globs.push(watcher[0]);
                        }
                        else {
                            watcher[0].triggers.push(trigger);
                        }
                        trigger.watches.push(watcher[0]);
                    }
                }

                if (study.reset) {
                    for(const reset of study.reset) {
                        EventBus.on('task', async (name, result) => {
                            Log.trace(`A reset might have been triggered by ${name} for ${reset}`);
                            if (name === reset && (result === 0 || result === undefined)) {
                                try {
                                    await this._updateFiles(trigger);
                                }
                                catch(e) {
                                    throw e;
                                }
                            }
                        });
                    }
                }

                this.triggers.push(trigger);
            }
        }
    }

    /**
     * Updates all files relative to a trigger
     * @param {{on: {string}, message: {Array}, actions: {string}, armed: {boolean}, watches: {array}}} trigger
     * @private
     */
    async _updateFiles(trigger) {
        Log.trace(`Updating all watched files`);
        for(const watch of trigger.watches) {
            if (!watch.files) {
                throw new Error('Must scan before update');
            }
            for(const file of watch.files) {
                this._database.updateFileSnapshot(file.path);
            }
        }
    }

    /**
     * Counts files
     * @param {array} trigger Array of triggers
     * @return {number}
     */
    async countFiles(trigger = []) {
        let total = 0;
        for(const path of this.globs) {
            if (path.files === undefined || this._isTriggerInGlob(path, trigger)) {
                path.files = [];
                const files = await new Promise((done, reject) => {
                    glob(path.path, {}, (err, files) => {
                        if (err) {
                            reject();
                        }

                        done(files);
                    });
                });
                for(const file of files) {
                    path.files.push({
                        path: file,
                        changed: true // we don't know if it changed yet, so assume: yes ... guilty until proven innocent
                    });
                }
            }
            total += path.files.length;
        }

        return total;
    }

    _isTriggerInGlob(globObj, trigger) {
        const trigg = new Set(trigger);
        const inIt = globObj.triggers.filter(t => trigger.length === 0 || trigg.has(t)).length > 0;
        return inIt;
    }


    /**
     * Scans all known file globs for matches
     * @param {array} trigger A list of triggers
     */
    async scan(trigger = []) {
        const fileCount = await this.countFiles(trigger);
        const all = [];
        let changedCount = 0;
        for(const globObj of this.globs) {
            if (this._isTriggerInGlob(globObj, trigger)) {
                for(const file of globObj.files) {
                    all.push(new Promise((done) => {
                        this._database.fileChanged(file.path).then((changed) => {
                            file.changed = changed;
                            changed ? changedCount++ : null;
                            done();
                        }).catch(() => {
                            // ignore errors ... probably a directory...
                            file.changed = false;
                            done();
                        });
                    }));
                }
            }
        }

        await Promise.all(all);

        return {
            changes: changedCount,
            totalFilesScanned: fileCount
        };
    }
}

export default Student;
