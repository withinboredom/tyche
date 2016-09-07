/**
 * @module lib/tool/docker-compose
 */
import Tool from 'lib/tool/base';

/**
 * @class
 * @extends Tool
 */
class DockerCompose extends Tool {
    /**
     * Creates a tool that understands docker-compose
     */
    constructor() {
        super();
        this.command = 'docker-compose';
    }

    /**
     * Inform the system that it knows Docker Compose
     * @return {string[]}
     */
    static get knows() {
        return ['docker-compose'];
    }

    /**
     * Generates the native command to execute for docker-compose
     * @param {{file: {string}, action: {string}, volumes: {boolean}, service: {string}, command: {string}}} command
     */
    set nativeCommand(command) {
        if (command.file) {
            this.native.push('-f', command.file);
        }

        this.native.push(command.action);

        switch (command.action) {
            case 'down':
                if (command.volumes) {
                    this.native.push('-v');
                }
                break;
        }

        if (command.service) {
            if (Array.isArray(command.service)) {
                this.native.push(...command.service);
            } else {
                this.native.push(command.service);
            }
        }

        if (command.command) {
            this.native.push(command.command);
        }
        this.initialized = true;
    }

    /**
     * Gets the tool's name
     * @return {string}
     */
    get toolName() {
        return 'docker-compose';
    }

    /**
     * Build from a task definition
     * @param {Task} step
     * @param {object} meta
     * @return {boolean}
     */
    buildFromStep(step, meta) {
        if (!(step.exec['docker-compose'])) {
            return false;
        }

        const exec = step.exec['docker-compose'];

        this.nativeCommand = {
            action: exec.action || 'up',
            service: exec.service,
            file: exec.file || 'docker-compose.yml',
            command: exec.command || '',
            volumes: exec.volumes || false
        };

        return true;
    }
}

export default DockerCompose;
