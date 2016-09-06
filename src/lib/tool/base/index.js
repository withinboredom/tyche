import { spawn } from 'child_process';

export default class Tool {
    /**
     * The name of the tool
     * @returns {string} The name
     */
    get toolName() {
        throw new Error('name not overriden');
        return 'base-tool'; // eslint-disable-line
    }

    /**
     * Get the full native command
     * @returns {string} The full native command
     */
    get nativeCommand() {
        return `${this.command} ${this.native.join(' ')}`;
    }

    getDryRun() {
        const env = [];
        for(const e of Object.keys(this.env)) {
            let requiresQuotes = true;
            if (!Number.isNaN(e)) {
                requiresQuotes = false;
            }

            let quotes = '';
            if (requiresQuotes) {
                quotes = '"';
            }

            env.push(`${e}=${quotes}${this.env[e]}${quotes}`);
        }
        return `${env.join(' ')}${env.length > 0 ? ' ' : ''}${this.command} ${this.native.join(' ')}`;
    }

    set dryRun(doDry) {
        this.dry = doDry;
    }

    static get knows() {
        return [];
    }

    //noinspection JSAnnotator
    /**
     * Set the native command
     * @param {[string]} command The command parameters for the tool
     */
    set nativeCommand(command) {
        this.native = command;
        this.initialized = true;
    }

    set meta(meta) {
        this.env = meta;
    }

    /**
     * Builds a command from a step
     * @param {Object} task The task to build from
     * @return {boolean} Returns true if this tool can be built from this task
     */
    buildFromStep(task) {
        this.nativeCommand = task;
        throw new Error('buildFromStep not override');
        return false; //eslint-disable-line
    }

    /**
     * Executes the tool natively and returns a promise
     * @param {boolean} showOutput Should show output?
     * @returns {Promise} A promise for the tool
     */
    execTool(showOutput = true) {
        if (!this.initialized) {
            throw new Error('Command not initialized!');
        }

        const config = {shell: false, stdio: 'pipe'};
        if (showOutput) {
            config.shell = true;
            config.stdio = 'inherit';
            config.env = this.env;
        }

        if (this.dry) {
            console.log(this.command, this.native.join(' '));
            return Promise.resolve();
        }

        const cmd = spawn(this.command, this.native, config);

        return new Promise((done, reject) => {
            cmd.on('close', code => {
                if (code !== 0) {
                    console.error('Task failed');
                    reject(code);
                }
                done({
                    code,
                });
            });
        });
    }

    constructor() {
        this.native = [];
        this.command = '';
        this.initialized = false;
        this.dry = false;
        this.env = {};
    }
}
