import assert from 'assert';
import path from 'path';
import configLoader from '../config';

class test {

    /**
     * Handles basic setup for tests, as well as testing the loader itself
     * @returns {Config|undefined} The config object
     */
    static testLoadConfig() {
        const config = configLoader.loadConfig(path.normalize(`${__dirname}/../../../../assets/tests/configs/simple-config.json`));

        assert.deepEqual(config.raw, {
                "requires": [
                    {
                        "tool": "dummy",
                        "version": "1"
                    }
                ],
                "projects": [
                    {
                        "name": "test1",
                        "build": {
                            "tool": "dummy",
                            "something": "hello",
                            "bare": "echo hello"
                        }
                    },
                    {
                        "name": "test2",
                        "build": {
                            "tool": "dummy",
                            "something": "world",
                            "bare": "echo world"
                        }
                    }
                ]
            }, 'raw does not match file');

        return config;
    }

    /**
     * Attempt to load an invalid path of a config file
     */
    static invalidPath() {
        assert.strictEqual(configLoader.loadConfig('nothin.json'), undefined, 'undefined should be returned for non-existance');
    }
}

test.testLoadConfig();
test.invalidPath();
