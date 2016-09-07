/**
 * @module lib/student
 */

import glob from 'glob';

/**
 * Describe how to study
 */
class Student {

    /**
     * Creates a student to study this repo
     * @param {database} database A reference to a database
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

                this.triggers.push(trigger);
            }
        }
    }

    async countFiles() {
        let total = 0;
        for(const path of this.globs) {
            if (path.files === undefined) {
                path.files = [];
                const files = await new Promise((done, reject) => {
                    glob(path.path, {}, (err, files) => {
                        if (err) {
                            reject();
                        }

                        done(files);
                    })
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

    /**
     * Scans all known file globs for matches
     */
    async scan() {
        const fileCount = await this.countFiles();
        const all = [];
        let changedCount = 0;
        for(const globObj of this.globs) {
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

        await Promise.all(all);

        return {
            changes: changedCount,
            totalFilesScanned: fileCount
        };
    }
}

export default Student;
