/**
 * @module
 */
import Task from '../task';

/**
 * Handles app configuration
 * @class
 */
class Config {
    /**
     * Create a new config object
     * @param {{tasks: {object}, settings: {object}}} config The raw configuration object
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
                this.topLevelTasks.push(this.tasks.find(i => i.name === t.name));
            }
        } else {
            this.topLevelTasks = [];
        }
        this.defaultTool = (config.settings && config.settings.defaultTool) || 'native';
    }

    /**
     * Loads a configuration file and returns a config object
     * @param {string} file The file to load
     * @returns {Config|undefined} The configuration object
     */
    static loadConfig(file) {
        try {
            const raw = require(file);
            return new Config(raw);
        } catch(e) {
            console.error(`Unable to load config file: ${file}`);
            throw e;
        }
    }
}

export default Config;
