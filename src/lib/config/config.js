export default class Config {
    constructor(config) {
        this.raw = config;
    }

    static loadConfig(file) {
        console.log(`loading ${file}`);
        const raw = require(file);
        return new Config(raw);
    }
}
