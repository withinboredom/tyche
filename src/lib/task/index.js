/**
 * The task module. It makes the world go 'round
 * @module lib/task
 */

import fs from 'fs';
import toolMachine from '../tool';
import EventBus from '../bus';
import Logger from 'lib/logger';

const Log = Logger.child({
    component: 'Task'
});

/**
 * A task can execute tools based off a definition
 * @class
 */
class Task {
    /**
     * Define a task
     * @param {TycheDb} database
     * @param {{ name: {string}, description: {string}, exec: {object}, tasks: {Task[]}, skips: {object}, constraints: {object}, dependencies: {string[]}}} definition
     */
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

        this.buildNumber = database.buildNumber;

        Log.trace(`Creating task with name: ${this.name}`);

        /**
         * We particularly care about the dependencies key, as we'll need to prepend them to the tasks list, however...
         * we have to find them and keep track of them in our children until they are all resolved...
         *
         * Obviously, this isn't very efficient and could use some work in a later iteration
         */

        for(const child of definition.tasks) {
            // we create a new task and try to find any matching unresolved dependencies
            const task = new Task(database, child);
            this.tasks.push(task);
        }

        // after creating children, look for resolving external deps
        for(const task of this.tasks) {
            for(const unresolved of task.unresolved) {
                const found = this.search(unresolved.name);
                if (found) {
                    unresolved.fix(found);
                }
                else {
                    this.unresolved.push(unresolved);
                }
            }
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
        Log.trace(`Searching dependency tree for ${name}`);
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
    async shouldSkip(preferredTool) {
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
                for(const file of this.skips.path_exists) {
                    try {
                        fs.accessSync(file, fs.F_OK);
                        Log.trace(`skipping ${this.name} because ${file} exists`);
                        skip();
                    }
                    catch (e) {
                        noSkip();
                        Log.trace(`Path ${file} does not exist, so not skipping ${this.name}`);
                    }
                }
            }

            if (this.skips.files_not_changed) {
                for(const file of this.skips.files_not_changed) {
                    if((await this.database.fileChanged(file))) {
                        noSkip();
                        Log.trace(`File ${file} changed, so not skipping ${this.name}`)
                    }
                    else {
                        skip();
                        Log.trace(`Skipping ${this.name} because ${file} hasn't changed`);
                    }
                }
            }
        }

        // now we check constraints that may affect skipping
        if (this.exec) {
            if (this.constraints && this.constraints.always_use_tool && this.constraints.ignore_preferred_tool) {
                preferredTool = toolMachine(this.constraints.always_use_tool);
                Log.warn(`Changing default tool to ${this.constraints.always_use_tool} due to constraints`);
            }

            let foundTool = false;
            for (const tool of Object.keys(this.exec)) {
                if (preferredTool.knows.find(e => e === tool) !== undefined) {
                    foundTool = true;
                }
            }
            if (!foundTool) {
                Log.warn(`Couldn't find a tool for ${this.name} so we are skipping it`);
                skip();
            }
        }

        Log.trace(`skip? ${this.name}: ${skipCount}==${noSkipCount} (but not 0) or ${this.skips.forced}`);
        if((skipCount === noSkipCount && noSkipCount > 0) || this.skips.forced) {
            // we need to mark all deps as being skipable?
            Log.debug(`decided to skip ${this.name}`);
            if (this.skips.skip_dependencies_if_skip) {
                Log.debug(`Triggering force skip of dependencies of ${this.name}`);
                this.markSkip(true, true);
                skip();
            }

            return true;
        }

        Log.debug(`decided not to skip ${this.name}`);
        return false;
    }

    /**
     * Gets all the dependencies of this task
     * @return {Array}
     */
    children() {
        const kids = [];
        for(const child of this.tasks) {
            kids.push(child.name);
        }

        return kids;
    }

    /**
     * Marks a task as force skipped
     * @param {boolean} yesno True to skip, False to allow automatic detection
     * @param {boolean} recursive Should this be set recursively?
     */
    markSkip(yesno, recursive) {
        Log.trace(`Setting ${this.name} to be force-skipped`);
        this.skips.forced = yesno;
        if (recursive) {
            for(const task of this.tasks) {
                Log.trace(this.tasks.map(e => e.name));
                task.markSkip(yesno, recursive);
            }
        }
    }

    /**
     * Determines which tool should be used in executing
     * @param {Tool} preferredTool The preferred Tool
     * @return {Tool} The tool to use
     * @private
     */
    _getConstrainedTool(preferredTool) {
        let tool = preferredTool;
        if (this.constraints && this.constraints.always_use_tool && this.constraints.ignore_preferred_tool) {
            tool = toolMachine(this.constraints.always_use_tool);
        }
        return tool;
    }

    /**
     * Captures an executor
     * @param {Tool} preferredTool The preferred tool
     * @return {Tool} The executor for the tool
     * @private
     */
    _getExecutor(preferredTool) {
        const tool = this._getConstrainedTool(preferredTool);
        const executor = new tool();
        executor.buildFromStep(this);
        executor.meta = {BUILD_NUMBER: this.database.buildNumber};
        return executor;
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
            const executor = this._getExecutor(preferredTool);
            Log.trace(`${this.name} is running a dry run using ${executor.toolName}`);
            result = executor.getDryRun();
        }

        const action = {
            exec: result,
            name: this.name,
            result: false,
            skipped: await this.shouldSkip(preferredTool)
        };

        complete.push(action);

        return complete;
    }

    /**
     * Executes a task with a preferred tool
     * @param {Tool} preferredTool
     * @return {Array}
     */
    async execute(preferredTool) {
        Log.trace(`Starting execution of task ${this.name}`);
        let complete = [];
        for(const task of this.tasks) {
            complete = complete.concat(await task.execute(preferredTool));
        }

        let result = false;
        let dry = false;

        if (this.exec) {
            const executor = this._getExecutor(preferredTool);
            dry = executor.getDryRun(); // order is important here ...
            if (!(await this.shouldSkip(preferredTool))) {
                Log.trace(`${this.name} executing with tool: ${executor.toolName}`);
                result = await executor.execTool();

                // update files this task watches
                if (this.skips.files_not_changed) {
                    for (const file of this.skips.files_not_changed) {
                        this.database.updateFileSnapshot(file); // we don't actually need to wait for this to complete?
                    }
                }
            }
        }

        Log.trace(`Completing execution of task ${this.name}`);

        // let any listeners know the task is complete
        EventBus.emit('task', this.name, result.code);

        const action = {
            exec: dry,
            name: this.name,
            result: result.code,
            skipped: await this.shouldSkip(preferredTool)
        };

        complete.push(action);

        return complete;
    }
}

export default Task;
