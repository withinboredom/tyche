import fs from 'fs';
import toolMachine from '../tool';

export default class Task {
    constructor(database, definition) {
        this.database = database;
        this.definition = definition;
        this.name = definition.name;
        this.description = definition.description;
        this.exec = definition.exec || null;

        this.definition.tasks = this.definition.tasks || [];
        this.skips = this.definition.skips || {};
        this.constraints = this.definition.constraints || {};

        this.tasks = [];
        this.unresolved = definition.dependencies || [];

        /**
         * We particularly care about the dependencies key, as we'll need to prepend them to the tasks list, however...
         * we have to find them and keep track of them in our children until they are all resolved...
         *
         * Obviously, this isn't very efficient and could use some work in a later iteration
         */

        for(const child of definition.tasks) {
            // we create a new task and try to find any matching unresolved dependencies
            const task = new Task(database, child);
            for(const unresolved of task.unresolved) {
                const found = this.search(unresolved.name);
                if (found) {
                    unresolved.fix(found);
                }
                else {
                    this.unresolved.push(unresolved);
                }
            }
            this.tasks.push(task);
        }

        const toResolve = [];
        for(const unresolved of this.unresolved) {
            if (typeof unresolved === 'string') {
                toResolve.push({
                    name: unresolved,
                    fix: (found) => {
                        this.tasks.unshift(found);
                    }
                });
            }
            else {
                toResolve.push(unresolved);
            }
        }
        this.unresolved = toResolve;
    }

    /**
     * Searches the entire dependency tree
     * @param {string} name The name of the task to find
     * @return {null|Task} The task, if found
     */
    search(name) {
        if(this.name === name) return this;

        for(const task of this.tasks) {
            const result = task.search(name);
            if (result) return result;
        }

        return null;
    }

    /**
     * Whether or not this task should be skipped
     * @param {Tool} preferredTool The preferred execution tool
     * @return {boolean} False: do not skip, True: skip
     */
    shouldSkip(preferredTool) {
        let skipCount = 0;
        let noSkipCount = 0;

        function skip() {
            skipCount++;
            noSkipCount++;
        }

        function noSkip() {
            noSkipCount++;
        }

        if(this.skips) {
            if(this.skips.path_exists) {
                try {
                    fs.accessSync(this.skips.path_exists, fs.F_OK);
                    skip();
                }
                catch (e) {
                    noSkip();
                }
            }

            if (this.skips.files_not_changed) {
                throw new Error('not implemented yet');
            }
        }

        // now we check constraints that may affect skipping
        if (this.exec) {
            if (this.constraints && this.constraints.always_use_tool && this.constraints.ignore_preferred_tool) {
                preferredTool = toolMachine(this.constraints.always_use_tool);
            }

            for (const tool of Object.keys(this.exec)) {
                if (preferredTool.knows.find(e => e === tool) === undefined) {
                    // check constraints
                    this.markSkip(true, false);
                }
            }
        }

        if((skipCount == noSkipCount && noSkipCount > 0) || this.skips.forced) {
            // we need to mark all deps as being skipable?
            if (this.skips.skip_dependencies_if_skip) {
                this.markSkip(true, true);
            }

            return true;
        }

        return false;
    }

    /**
     * Marks a task as force skipped
     * @param {boolean} yesno True to skip, False to allow automatic detection
     * @param {boolean} recursive Should this be set recursively?
     */
    markSkip(yesno, recursive) {
        this.skips.forced = yesno;
        if (recursive) {
            for(const task of this.tasks) {
                task.markSkip(yesno, recursive);
            }
        }
    }

    /**
     * Just like execute, except it doesn't actually execute
     * @param {Tool} preferredTool The tool that does the executing, maybe... it depends
     * @return {Array}
     */
    async dry(preferredTool) {
        let complete = [];
        for(const task of this.tasks) {
            complete = complete.concat(await task.dry(preferredTool));
        }

        let result = false;
        if (this.exec) {
            const executor = new preferredTool();
            executor.buildFromStep(this);
            result = executor.getDryRun();
        }

        const action = {
            exec: result,
            name: this.name,
            result: false,
            skipped: this.shouldSkip(preferredTool)
        };

        complete.push(action);

        return complete;
    }

    async execute(preferredTool) {
        let complete = [];
        for(const task of this.tasks) {
            complete = complete.concat(await task.dry(preferredTool));
        }

        let result = false;
        let dry = false;
        if (this.exec) {
            const executor = new preferredTool();
            executor.buildFromStep(this);
            result = await executor.execTool();
            dry = executor.getDryRun();
        }

        const action = {
            exec: dry,
            name: this.name,
            result: result.code,
            skipped: this.shouldSkip(preferredTool)
        };

        complete.push(action);

        return complete;
    }
}
