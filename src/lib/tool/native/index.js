import Tool from 'lib/tool/base';
import os from 'os';

export default class Native extends Tool {
    constructor() {
        super();
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

            this.nativeCommand = (native || psuedo || notNativeButNative).command;
        }

        return true;
    }
}
