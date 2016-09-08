/**
 * @module lib/tool/native
 */
import Tool from 'lib/tool/base';
import os from 'os';

/**
 * @class
 * @extends Tool
 */
class Native extends Tool {
    /**
     * Creates a native tool
     */
    constructor() {
        super();
        this.command = 'echo';
    }

    /**
     * Generates a native command given a string array
     * @param {string[]} command
     */
    set nativeCommand(command) {
        this.command = command[0];
        this.native = command.slice(1);
        this.initialized = true;
    }

    /**
     * Get the tool name
     * @return {string}
     */
    get toolName() {
        return 'native';
    }

    /**
     * Get the specialized strings
     * @return {{universal: string, specific: string}}
     * @private
     */
    static get _specialized() {
        let universal = 'native';

        switch (os.platform()) {
            case "darwin":
            case "freebsd":
            case "linux":
            case "openbsd":
                universal = 'native-nix';
                break;
            case 'win32':
                universal = 'native-win';
                break;
        }

        return {
            universal: universal,
            specific: `native-${os.platform()}`
        };
    }

    /**
     * Describes what this tool knows
     * @return {string[]}
     */
    static get knows() {
        const completely = [];
        const special = this._specialized;
        completely.push(special.universal);
        completely.push(special.specific);
        if (special.universal !== 'native') completely.push('native');

        return completely;
    }

    getConfig() {
        return this.config;
    }

    /**
     * Builds from a task
     * @param {Task} step
     * @return {boolean}
     */
    buildFromStep(step) {
        let universal = 'native';

        if (step.exec) {

            switch (os.platform()) {
                case "darwin":
                case "freebsd":
                case "linux":
                case "openbsd":
                    universal = 'native-nix';
                    break;
                case 'win32':
                    universal = 'native-win';
                    break;
            }

            const native = step.exec[`native-${os.platform()}`];
            const psuedo = step.exec[universal];
            const notNativeButNative = step.exec.native;

            if (!(native || psuedo || notNativeButNative)) {
                return false;
            }

            const runStep = (native || psuedo || notNativeButNative);

            let working = process.cwd();

            if (runStep.working) {
                working = runStep.working;
            }

            if (runStep.acceptsArgs) {
                runStep.command.push(...process.argv);
            }

            this.nativeCommand = runStep.command;

            this.config = {
                cwd: working
            };
        }

        return true;
    }
}

export default Native;
