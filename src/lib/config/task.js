import {depResolve, Node} from 'lib/config/deps';

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
        for(const babyTask of taskJSON.tasks) {
            const childTask = new Task(babyTask, taskList);
            this.addEdge(childTask);
            this.dependencies.push(childTask);
        }

        this.unresolvedDependencies = taskJSON.dependencies || [];
        this.skips = taskJSON.skips || [];
        this.exec = taskJSON.exec || {};
        this.always = taskJSON.always || false;
        this.constraints = taskJSON.constraints || [];

        taskList.push(this);
    }

    /**
     * Should this task be skipped?
     * @returns {boolean} True if the task should be skipped
     */
    shouldSkip() {
        //todo: implement this
        return false;
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
     * @returns {Task[]} The list of tasks to execute
     */
    resolve() {
        const resolved = [];
        depResolve(this, resolved);
        return resolved; //todo: filter based on deps and constraints
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

    for(const task of taskList) {
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
