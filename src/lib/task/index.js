/**
 * The task module. It makes the world go 'round
 * @module lib/task
 */

import fs from 'fs';
import toolMachine from '../tool';
import EventBus from '../bus';
import Logger from 'lib/logger';
import UnresolvedTask from './unresolvedTask';

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
    constructor(database, definition, parent) {
        this.database = database;
        this.definition = definition;
        this.name = definition.name;
        this.description = definition.description;
        this.exec = definition.exec || null;

        this.definition.tasks = this.definition.tasks || [];
        this.skips = this.definition.skips || {};
        this.constraints = this.definition.constraints || {};

        this.tasks = [];

        Log.trace(`Creating task with name: ${this.name}`);

        /**
         * We particularly care about the dependencies key, as we'll need to prepend them to the tasks list, however...
         * we have to find them and keep track of them in our children until they are all resolved...
         *
         * Obviously, this isn't very efficient and could use some work in a later iteration
         */

        this.tasks = definition.tasks.map(child => {
            // if this is a task that exists somewhere else
            if (typeof child === 'string' || child instanceof String) {
                Log.trace(`Found external dependency: ${child} ... putting aside to figure out later`);
                return new UnresolvedTask(child, this);
            }
            else {
                Log.trace(`Found real dependency: ${child.name}`);
                return new Task(database, child, this);
            }
        });

        const allResolved = this._findUnresolvedTasks().map(utask => {
            const found = this.search(utask.name);
            if (found) {
                Log.trace(`Resolved unresolved dependency: ${found.name}`);
                utask.fix(found);
                return true;
            }

            return utask.name;
        }).filter(namesOnly => namesOnly !== true);

        if (!parent && allResolved.length > 0) {
            throw new Error(`There are unresolved dependencies: ${allResolved.reduce((prev, current) => {
                return (prev === '' ? '' : ', ') + prev + current;
            }, '')}`)
        }
    }

    /**
     * Perform a transitive reduction on the task tree
     * @see https://en.wikipedia.org/wiki/Transitive_reduction
     * @param {undefined|Task} parent The starting point of the reduction
     * @param {undefined|string[]} children A snapshot of the direct descendants of the parent
     */
    reduce(parent, children) {
        // for each vertex 'v', such that 'v' is a direct descendant of 'this'
        if (parent === undefined) {
            if (this.tasks) {
                Log.trace(`Reducing, starting from ${this.name}`);
                const children = this.tasks.map(e => e.name);
                Log.trace(children);
                this.tasks.map(vertex => vertex.reduce(this, children));
                this.tasks.map(vertex => vertex.reduce());
            }
        }
        else {
            if (this.tasks) {
                Log.trace(`Reducing ${this.name}`);
                this.tasks.map(vertex => {
                    if (children.filter(e => vertex.name === e).length > 0) {
                        Log.trace(`Found long dep to ${vertex.name}`);
                        Log.trace(`Removing ${vertex.name} from ${parent.name}`);
                        parent.tasks = parent.tasks.filter(e => e.name !== vertex.name);
                        vertex.reduce(parent, children);
                    }
                });
            }
        }
    }

    /**
     * Searches the task tree for unresolved tasks
     * @return {Array} An array of unresolved dependencies
     * @private
     */
    _findUnresolvedTasks() {
        const results = [];
        for(const task of this.tasks) {
            if (task instanceof UnresolvedTask) results.push(task);
            else results.push(...task._findUnresolvedTasks());
        }

        return results;
    }

    /**
     * Searches the entire dependency tree for resolved tasks
     * @param {string} name The name of the task to find
     * @return {null|Task} The task, if found
     */
    search(name) {
        Log.trace(`Searching dependency tree for ${name}`);
        if(this.name === name) return this;

        return this.tasks.map(task => {
            if (task instanceof UnresolvedTask) return null;

            const result = task.search(name);
            if (result) {
                Log.trace(`Found ${name}`);
                return result;
            }

            return null;
        }).reduce((prev, current) => {
            if (prev) {
                return prev;
            }

            if (current) {
                return current;
            }
        }, null);
    }

    /**
     * Whether or not this task should be skipped
     * @param {Tool} preferredTool The preferred execution tool
     * @return {boolean} False: do not skip, True: skip
     */
    async shouldSkip(preferredTool) {
        Log.trace(`Determining if ${this.name} should be skipped`);
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
                await Promise.all(this.skips.path_exists.map(file => {
                    return new Promise(done => {
                        try {
                            fs.accessSync(file, fs.F_OK);
                            Log.trace(`skipping ${this.name} because ${file} exists`);
                            skip();
                        }
                        catch (e) {
                            noSkip();
                            Log.trace(`Path ${file} does not exist, so not skipping ${this.name}`);
                        }
                        finally {
                            done();
                        }
                    });
                }));
            }

            if (this.skips.files_not_changed) {
                await Promise.all(this.skips.files_not_changed.map(file => {
                    return new Promise(async (done) => {
                        if ((await this.database.fileChanged(file))) {
                            noSkip();
                            Log.trace(`File ${file} changed, so not skipping ${this.name}`)
                        }
                        else {
                            skip();
                            Log.trace(`Skipping ${this.name} because ${file} hasn't changed`);
                        }
                        done();
                    });
                }));
            }
        }

        // now we check constraints that may affect skipping
        if (this.exec) {

            // if the constraint is to change the tool, then change it
            if (this.constraints && this.constraints.always_use_tool && this.constraints.ignore_preferred_tool) {
                preferredTool = toolMachine(this.constraints.always_use_tool);
                Log.warn(`Changing default tool to ${this.constraints.always_use_tool} due to constraints`);
            }

            // Find the intersections of what the tool and the task knows how to do.
            const toolKnows = new Set(preferredTool.knows);
            const taskKnows = new Set(Object.keys(this.exec));
            const intersection = new Set([...toolKnows].filter(x => taskKnows.has(x)));
            const foundTool = intersection.size > 0;

            if (!foundTool) {
                Log.warn(`Couldn't find a tool for ${this.name} so we are skipping it`);
                this.skips.forced = true;
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
        Log.trace(`Getting actual tool from tool machine`);
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
        Log.trace('Getting executor');
        const tool = this._getConstrainedTool(preferredTool);
        const executor = new tool();
        executor.buildFromStep(this);
        executor.meta = {BUILD_NUMBER: this.database.buildNumber};
        return executor;
    }

    /**
     *
     * @param {Task[]} arr An array of tasks (or some object)
     * @param {string} func The function to call on each object in arr
     * @param {*[]} params An array of parameters to call on each task.func
     * @return {Promise} An Promise that resolves to an array of results
     * @private
     */
    _chain(arr, func, params) {
        return arr.reduce((prev, current) => {
            return new Promise(async (done) => {
                const progress = await prev;
                progress.push(...(await current[func](...params)));
                done(progress);
            });
        }, Promise.resolve([]));
    }

    /**
     * Just like execute, except it doesn't actually execute
     * @param {Tool} preferredTool The tool that does the executing, maybe... it depends
     * @return {Array}
     */
    async dry(preferredTool) {
        const complete = await this._chain(this.tasks, 'dry', [preferredTool]);

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
        const complete = await this._chain(this.tasks, 'execute', [preferredTool]);

        let result = false;
        let dry = false;

        if (this.exec) {
            Log.trace(`Getting executor for ${this.name}`);
            const executor = this._getExecutor(preferredTool);
            Log.trace(`Got executor for ${this.name} with ToolName: ${executor.toolName}`);
            dry = executor.getDryRun(); // order is important here ...
            if (!(await this.shouldSkip(preferredTool))) {
                Log.trace(`${this.name} executing with tool: ${executor.toolName}`);
                result = await executor.execTool();
                if (result.code != 0) {
                    throw new Error('Oh noes ... something happened');
                }

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
