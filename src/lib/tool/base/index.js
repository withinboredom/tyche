/**
 * This is the base tooling module. All tools are inherited from this base class
 * @module lib/tool/base
 */
import { spawn } from 'child_process';
import Logger from 'lib/logger';

const Log = Logger.child({
    component: 'Tool'
});

/**
 * The base tool
 * @class
 */
export default class Tool {
    /**
     * The name of the tool
     * @returns {string} The name
     * @abstract
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

    /**
     * Get dry run output
     * @return {string}
     */
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

    /**
     * Describes what tools this tool knows how to process
     * @abstract
     * @return {Array}
     */
    static get knows() {
        return [];
    }

    /**
     * Set the native command
     * @param {string} command The command parameters for the tool
     * @abstract
     */
    set nativeCommand(command) {
        this.native = command;
        this.initialized = true;
    }

    /**
     * Set meta-data (environment variables) for this tool
     * @param meta
     */
    set meta(meta) {
        for(const key of Object.keys(meta)) {
            this.env[key] = meta[key];
        }
    }

    /**
     * Builds a command from a step
     * @param {Object} task The task to build from
     * @return {boolean} Returns true if this tool can be built from this task
     * @abstract
     */
    buildFromStep(task) {
        this.nativeCommand = task;
        throw new Error('buildFromStep not override');
        return false; //eslint-disable-line
    }

    /**
     * Get the native configuration
     * @return {{shell: boolean, stdio: string}}
     */
    getConfig() {
        return {shell: false, stdio: 'pipe'};
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

        Log.trace('Getting configuration');
        const config = this.getConfig();

        // these next three lines could be moved out to a utility function ...
        const env = this.env;
        this.env = process.env;
        this.meta = env;

        if (showOutput) {
            config.shell = true;
            config.stdio = 'inherit';
            config.env = this.env;
        }

        Log.trace(`About to execute $(${this.command} ${this.native.join(' ')})`);
        const cmd = spawn(this.command, this.native, config);

        return new Promise((done, reject) => {
            cmd.on('error', err => {
                Log.trace(`Error running command!`);
                Log.error(`The task failed unexpectedly, it is likely that you are running an old version of nodejs. Please update.`);
                Log.error(err);
                reject(127);
            });
            cmd.on('close', code => {
                Log.trace(`Execution completed with exit code ${code}`);
                if (code !== 0) {
                    Log.error(`Task failed`);
                    done(code);
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
