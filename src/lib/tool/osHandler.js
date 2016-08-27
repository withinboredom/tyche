import {spawn} from 'child-process-promise';

/**
 * An identity class
 */
class OsHandler {
    /**
     * Installs a package of a given name at a specific version
     * @param {string} packageName The name of the package to install
     * @param {string} version The version of the package to install
     * @returns {boolean} Whether the installation was a success
     */
    install(packageName, version) {
        // this is a dummy, for tests
        return (packageName === 'test' && version === '1.1.1');
    }

    async spawn(command, args, options) {
        const promise = spawn(command, args, options);
        promise.childProcess.stdout.on('data', (data) => {
            console.log(data);
        });
        promise.childProcess.stderr.on('data', (data) => {
            console.log(data);
        });

        return promise;
    }
}

class Osx86Handler extends OsHandler {
    install(packageName, version) {
        this.spawn('brew', [
            'tap', 'homebrew/versions'
        ]);

    }
}

export {OsHandler, Osx86Handler};
