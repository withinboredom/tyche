import {depResolve, Node} from "lib/config/deps";
import {hashFileList} from "lib/config/hash";
import db, {getFilesCollection, getStatusCollection} from "lib/config/db";
import {configPath} from "lib/config/paths";
import Switcher from "lib/oneWaySwitch";
import ToolMachine from "lib/tool";
import fs from "fs";

/**
 * Represents a task that has dependencies, executors, skip rules, and constraints
 */
class Task extends Node {
    /**
     * Creates a Task
     * @param {Object} taskJSON The json object to create
     * @param {Task[]} taskList A mutable list of tasks
     */
    constructor(taskJSON, taskList = []) {
        super(taskJSON.name);

        // wire up dependencies
        this.dependencies = [];
        if (taskJSON.tasks && taskJSON.tasks.length >= 0) {
            for (const babyTask of taskJSON.tasks) {
                const childTask = new Task(babyTask, taskList);
                this.addEdge(childTask);
                this.dependencies.push(childTask);
            }
        }

        this.unresolvedDependencies = taskJSON.dependencies || [];
        this.skips = taskJSON.skips || {};
        this.exec = taskJSON.exec || {};
        this.always = taskJSON.always || false;
        this.constraints = taskJSON.constraints || [];

        taskList.push(this);
    }

    /**
     * Should this task be skipped?
     * @returns {boolean} True if the task should be skipped
     */
    async shouldSkip() {
        const shouldSkip = new Switcher();
        const shouldRun = new Switcher();
        if (this.skips.files_not_changed) {
            const database = await db();
            const collection = await getFilesCollection(database);

            this.skips.files_not_changed.push(`${await configPath()}/tyche.json`);
            const hashes = await hashFileList(this.skips.files_not_changed);
            for(const file of hashes) {
                const data = collection.by('file', file.file);

                if (!data) {
                    // add this file to the collection
                    collection.insertOne(file);
                    shouldSkip.isActive = false;
                    shouldRun.isActive = true;
                    continue;
                }

                if (data.digest === file.digest) {
                    shouldSkip.isActive = true;
                    shouldRun.isActive = false;
                    continue;
                }

                shouldSkip.isActive = false;
                shouldRun.isActive = true;
                data.digest = file.digest;
                collection.update(data);
            }

            database.saveDatabase();
        }

        if (this.skips.path_exists) {
            for(const path of this.skips.path_exists) {
                if (fs.exists(path)) {
                    shouldRun.isActive = true;
                    shouldSkip.isActive = false;
                    continue;
                }
                shouldSkip.isActive = true;
                shouldRun.isActive = false;
            }
        }

        return !shouldRun.isActive || shouldSkip.isActive; //todo: refactor to all or nothing...
    }

    /**
     * Should the task be stopped?
     * @returns {boolean} True if the task should stop
     */
    shouldConstrain() {
        //todo: implement this
        return false;
    }

    /**
     * Get the list of dependencies to execute this task
     * @param {string} stopAt Stop the task at a specific dependency
     * @returns {Task[]} The list of tasks to execute
     */
    resolve(stopAt) {
        const resolved = [];
        depResolve(this, resolved);
        let keepGoing = true;
        return resolved.filter(e => {
            if (e.name === stopAt) {
                keepGoing = false;
                return true;
            }
            return keepGoing;
        });
    }

    /**
     * Executes the task, given the spcificied tool
     * @param {string} tool The tool to use to execute the task
     * @param {string} stopAt Stop running at a certain point
     * @param {boolean} dry Dry run if true
     * @returns {*} not really anythingb
     * @todo: Make this function simpler!!
     */
    async execute(tool, stopAt, dry, config) {
        const deps = this.resolve(stopAt);

        let skipDeps = null;
        for(const dep of deps) {
            if (await dep.shouldSkip()) {
                if (dep.skips.skip_dependencies_if_skip) {
                    skipDeps = dep;
                }
                if (dep.skips.skip_after_if_skip) {
                    stopAt = dep;
                    break;
                }
            }
        }

        if (dry) {
            console.log("Now generating a script for you");
            console.log("-------------------------------");
            console.log('#!/bin/sh'); // hard coded linux ... ugh...
            console.log("# Begin generated output");
        }

        const completed = [];

        for(const dep of deps) {
            let skip = false;
            let skipThis = false;
            if (skipDeps !== null && skipDeps !== dep) {
                skip = true;
            } else if (skipDeps && skipDeps === dep) {
                skipDeps = null;
                skip = false;
                skipThis = true;
            }
            if ((skip || skipThis) && !dry) {
                continue;
            }

            const tools = [ tool, config.defaultTool, 'native' ];

            if (Object.keys(dep.exec).length !== 0) {
                let executor = null;
                for(const preferredTool of tools) {
                    if (preferredTool === null || preferredTool === undefined) {
                        continue;
                    }
                    const tooling = ToolMachine(preferredTool);
                    executor = new tooling();
                    if(executor.buildFromStep(dep)) {
                        break;
                    }
                }

                if (executor === null) {
                    console.error(`Unable to find a tool to run task ${dep.name}`)
                    throw new Error(`Unable to find a tool to run task ${dep.name}`);
                }

                if (!dry) {
                    console.log(`Running task ${dep.name} with ${executor.toolName} executor`);
                }
                executor.dryRun = dry;
                if (dry && (skip || skipThis)) {
                    console.log("# Real run will skip next command");
                }
                await executor.execTool();
                completed.push(dep.name);
            }
        }
        if (dry) {
            console.log("# End generated output");
        } else {
            completed.push(this.name);
            const database = await db();
            const collection = await getStatusCollection(database);
            for(const complete of completed) {
                const data = collection.by('task', complete);

                if (!data) {
                    // insert commit sha into db
                    continue;
                }

                data.commit = true; // todo: update with real sha
            }
            database.saveDatabase();
        }

        return true;
    }
}

/**
 * Creates a list of tasks that can be used to do things...
 * @param {Array} taskJSON The list of tasks to build
 * @returns {Task[]} The list of tasks
 * @constructor
 */
function BuildTasks(taskJSON) {
    /**
     * A list of tasks
     * @type {[Task]}
     */
    const taskList = [];
    for(const babyTask of taskJSON) {
        new Task(babyTask, taskList);
    }

    const namesSeen = [];

    for(const task of taskList) {
        if (namesSeen.find(e => e === task.name) !== undefined) {
            throw new Error(`Duplicate task name found: ${task.name}`);
        }

        namesSeen.push(task.name);

        if (task.unresolvedDependencies.length > 0) {
            for(const taskToFind of task.unresolvedDependencies) {
                const dep = taskList.find(el => el.name === taskToFind);

                if (dep === undefined) {
                    throw new Error(`unable to resolve dependency for ${taskToFind}`);
                }

                task.addEdge(dep);
            }
        }

        task.unresolvedDependencies = [];
    }

    return taskList;
}

export default BuildTasks;
