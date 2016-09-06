import Tool from 'lib/tool/base';

export default class DockerCompose extends Tool {
    constructor() {
        super();
        this.command = 'docker-compose';
    }

    static get knows() {
        return ['docker-compose'];
    }

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

    get toolName() {
        return 'docker-compose';
    }

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
