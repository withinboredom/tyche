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
        return `echo ${this.native.join(' ')}`;
    }

    set dryRun(doDry) {
        this.dry = doDry;
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

    /**
     * Builds a command from a step
     * @param {Object} step The step to build from
     */
    buildFromStep(step) {
        this.nativeCommand = step;
        throw new Error('buildFromStep not override');
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
        }

        if (this.dry) {
            console.log(this.command, this.native.join(' '));
            return Promise.resolve();
        }

        const cmd = spawn(this.command, this.native, config);

        return new Promise(done => {
            cmd.on('close', code => {
                done({
                    code,
                });
            });
        });
    }

    constructor() {
        this.native = [];
        this.command = 'echo';
        this.initialized = false;
        this.dry = false;
    }
}
