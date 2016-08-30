import Tool from 'lib/tool/base';

export default class DockerCompose extends Tool {
    constructor() {
        super();
        this.command = 'docker-compose';
    }

    set nativeCommand(command) {
        if (command.file) {
            this.native.push('-f', command.file);
        }

        this.native.push(command.action);

        if (command.service) {
            this.native.push(command.service);
        }

        if (command.command) {
            this.native.push(command.command);
        }
        this.initialized = true;
    }

    get toolName() {
        return 'docker-compose';
    }

    buildFromStep(step) {
        if (!(step.exec['docker-compose'])) {
            return false;
        }

        const exec = step.exec['docker-compose'];

        this.nativeCommand = {
            action: exec.action || 'up',
            service: exec.service,
            file: exec.file || 'docker-compose.yml',
            command: exec.command || ''
        };

        return true;
    }
}
