import Tool from 'lib/tool/base';

export default class DockerCompose extends Tool {
    constructor() {
        super();
        console.log('created tool');
        this.command = 'docker-compose';
    }

    set nativeCommand(command) {
        if (command.file) {
            this.native.push('-f', command.file);
        }

        this.native.push('up');

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
        this.nativeCommand = step;
    }
}
