/**
 * Handles app configuration
 */
export default class Config {

    // properties

    /**
     * The raw configuration object
     * @type {Object}
     */
    raw = {};

    // methods

    /**
     * Create a new config object
     * @param {Object} config The raw configuration object
     */
    constructor(config) {
        this.raw = config;
    }

    /**
     * Loads a configuration file and returns a config object
     * @param {string} file The file to load
     * @returns {Config|undefined} The configuration object
     */
    static loadConfig(file) {
        console.log(`loading ${file}`);
        try {
            const raw = require(file);
            return new Config(raw);
        } catch(e) {
            console.error(`Unable to load config file: ${file}`);
            return undefined;
        }
    }
}
