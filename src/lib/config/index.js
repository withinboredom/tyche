import BuildTasks from './task';

/**
 * Handles app configuration
 */
export default class Config {
    /**
     * Create a new config object
     * @param {Object} config The raw configuration object
     */
    constructor(config) {
        this.raw = config;
        this.tasks = BuildTasks(config.tasks);
        if (this.raw.tasks) {
            this.topLevelTasks = [];
            for(const t of this.raw.tasks) {
                this.topLevelTasks.push(this.tasks.find(i => i.name === t.name));
            }
        } else {
            this.topLevelTasks = [];
        }
        this.defaultTool = (this.raw.settings && this.raw.settings.defaultTool) || 'native';
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
