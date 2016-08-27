import Tool from 'lib/tool/base';

export default class Native extends Tool {
    constructor() {
        super();
        console.log('created tool');
        this.command = 'echo';
    }

    set nativeCommand(command) {
        this.command = command[0];
        this.native = command.slice(1);
        this.initialized = true;
    }

    get toolName() {
        return 'native';
    }

    buildFromStep(step) {
        this.nativeCommand = step.command;
    }
}
