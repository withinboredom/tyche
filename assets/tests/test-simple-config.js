import assert from 'assert';
import path from 'path';
import configLoader from '../config';

class test {
    testLoadConfig() {
        const config = configLoader.loadConfig(path.normalize(`${__dirname}/../../../tests/simple-config.json`));

        assert.equal(config.raw, {
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
    }

    invalidPath() {
        assert.throws(configLoader.loadConfig('nothin.json'), 'breaks');
    }
}

const t = new test();
t.testLoadConfig();
t.invalidPath();
