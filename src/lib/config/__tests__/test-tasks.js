jest.mock('nodegit');
jest.mock('lokijs');

import createTasks from '../task';
import Config from '../';

const taskList = [{
    name: "test",
    description: "a description",
    tasks: [
        {
            name: "dep",
            description: "a dep",
            exec: {
                native: {
                    command: ["echo", "nothing"]
                }
            }
        }
    ]
}];

const unresolvable = [{
    name: "test",
    dependencies: [
        "boomtown"
    ]
}];

const duplicates = [{
    name: "test"
}, {
    name: "test"
}];

const getConfig = async () => {
    const configJson = {
        tasks: taskList,
        settings: {
            defaultTool: 'native'
        }
    };
    const config = new Config(configJson);
    return config;
};

const getSkipableConfig = async () => {
    const configJson = {
        tasks: [{
            name: "test-skip",
            description: "skips",
            skips: {
                skip_dependencies_if_skip: true,
                path_exists: ['node_modules']
            },
            tasks: [{
                name: 'no-run',
                exec: {
                    native: {
                        command: ['echo','nothing']
                    }
                }
            }]
        }],
        settings: {
            defaultTool: 'native'
        }
    };
    const config = new Config(configJson);
    return config;
};

describe('tasks', () => {
    it('can give tasks from sane json', async () => {
        const tasks = createTasks(taskList);
        expect(tasks.length).toBe(2);
    });
    it('can execute dry runs', async () => {
        const config = await getConfig();
        await config.tasks[0].execute('native', 5, true, config, true);
    });
    it('fails if dependencies cannot be resolved', async () => {
        try {
            createTasks(unresolvable);
        } catch(e) {
            expect(e).toBeDefined();
        }
    });
    it('fails if there are duplicate tasks', async () => {
        try {
            createTasks(duplicates);
        } catch(e) {
            expect(e).toBeDefined();
        }
    });
    it('can actually execute', async () => {
        const config = await getConfig();
        await config.tasks[0].execute('native', 5, false, config, true);
    });
    it('knows when to skip itself', async () => {
        const config = await getSkipableConfig();
        const task = config.tasks.filter(e => e.name == 'test-skip')[0];
        const skip = task.shouldSkip().skip;

        expect(skip).toBe(true);
    })
});

describe('config', () => {
    it('can fail to load a nonexistant config', async () => {
        try {
            Config.loadConfig('fail');
        } catch(e) {
            expect(e).toBeDefined();
        }
    });
    it('can load an empty config with no tasks', async () => {
        new Config({});
    });
    it('can load a real config file', async () => {
        Config.loadConfig('../../../tyche.json')
    })
})
