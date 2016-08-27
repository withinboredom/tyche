export default class Tool {
    get name() {
        return 'base-tool';
    }

    get nativeCommand() {
        return this.native;
    }

    set nativeCommand(command) {
        this.native = `echo ${command}`;
    }

    constructor() {
        this.native = "echo";
    }
}
