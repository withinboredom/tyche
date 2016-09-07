/**
 * @module
 */
import Task from '../task';
import Student from '../student';

/**
 * Handles app configuration
 * @class
 */
class Config {
    /**
     * Create a new config object
     * @param {{tasks: {object}, settings: {object}, study: {object}}} config The raw configuration object
     * @param {TycheDb} database The database to use
     */
    constructor(config, database) {
        if (config.tasks) {
            const root = {
                name: 'rootTaskABCD',
                tasks: config.tasks
            };
            this.tasks = new Task(database, root);
            this.topLevelTasks = [];
            for(const t of config.tasks) {
                this.topLevelTasks.push(t.name);
            }
        } else {
            this.topLevelTasks = [];
        }

        if(config.study) {
            this.student = new Student(database, config.study);
            this.student.scan();
        }

        this.defaultTool = (config.settings && config.settings.defaultTool) || 'native';
    }

    /**
     * Loads a configuration file and returns a config object
     * @param {string} file The file to load
     * @param {TycheDb} database The database
     * @returns {Config|undefined} The configuration object
     */
    static loadConfig(file, database) {
        try {
            const raw = require(file);
            return new Config(raw, database);
        } catch(e) {
            console.error(`Unable to load config file: ${file}`);
            throw e;
        }
    }
}

export default Config;
