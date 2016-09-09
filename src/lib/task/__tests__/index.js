import Task from '../';
import toolMachine from '../../tool';

jest.mock('../../database');

const doNothingTask = {
    name: 'do-nothing',
    description: 'does not do anything'
};

const doSomethingTask = {
    name: 'does-something',
    description: 'does an echo',
    exec: {
        native: {
            command: ['echo', 'hi']
        },
        'docker-compose': {
            action: 'up'
        }
    }
};

const skipsAlways = {
    name: 'skips-always',
    description: 'should always skip',
    skips: {
        path_exists: ['./node_modules']
    }
};

const sometimesSkips = {
    name: 'sometimes-skips',
    description: 'will skip if test file has not changed',
    exec: {
        native: {
            command: ['echo','hello','world']
        },
        'docker-compose': {
            action: 'down'
        }
    },
    skips: {
        files_not_changed: ['./test-file.json']
    }
};

const skipDeps = {
    name: 'skip-dependencies',
    description: 'always skip dependencies',
    skips: {
        skip_dependencies_if_skip: true,
        path_exists: ['./node_modules']
    }
};

const realLife = [
    {
        "name": "dependencies",
        "description": "Install build dependencies",
        "exec": {
            "native": {
                "command": ["npm","install"]
            },
            "docker-compose": {
                "service": "tyche-prep"
            }
        },
        "dependencies": [
            "clean"
        ],
        "skips": {
            "files_not_changed": [
                "package.json"
            ],
            "path_exists": [
                "node_modules"
            ],
            "skip_dependencies_if_skip": true
        }
    },
    {
        "name": "build-cli",
        "description": "Actually build the tool...",
        "exec": {
            "native": {
                "command": ["npm","run","build-cli"]
            },
            "docker-compose": {
                "service": "tyche-builder"
            }
        }
    }
];

const preferredTool = toolMachine('native');
class fakeDocker extends toolMachine('docker-compose') {
    constructor() {
        super();
        this.command = 'echo';
    }
}
const dockerCompose = toolMachine('docker-compose');

describe('tasks', () => {
    let database = null;
    beforeEach(() => {
        database = {
            buildNumber: 0
        };
        dockerCompose.command = 'echo';
    });

    it('can be described', () => {
        expect(() => new Task(database, doNothingTask)).not.toThrow();
    });

    it('can execute a task -- native', async () => {
        const test = new Task(database, doSomethingTask);
        expect(test).toBeDefined();
        expect(await test.execute(preferredTool)).toEqual([
            {
                name: 'does-something',
                exec: 'BUILD_NUMBER=0 echo hi',
                result: 0,
                skipped: false
            }
        ]);
    });

    it('can execute a task -- docker-compose', async () => {
        const test = new Task(database, doSomethingTask);
        expect(test).toBeDefined();
        expect(await test.execute(fakeDocker)).toEqual([{"exec":"BUILD_NUMBER=0 echo -f docker-compose.yml up","name":"does-something","result":0,"skipped":false}]);
    });

    it('can know whether or not to skip itself', async () => {
        const test = new Task(database, skipsAlways);
        expect(test).toBeDefined();
        expect(await test.shouldSkip(preferredTool)).toBe(true);

        const never = new Task(database, doNothingTask);
        expect(never).toBeDefined();
        expect(await never.shouldSkip(preferredTool)).toBe(false);
    });

    it('can skip its dependencies', async () => {
        const tasks = skipDeps;
        tasks.tasks = [
            doSomethingTask
        ];

        const test = new Task(database, tasks);
        expect(test).toBeDefined();
        expect(await test.shouldSkip(preferredTool)).toBe(true);
        expect(await test.dry(preferredTool)).toEqual([
            {
                name: 'does-something',
                exec: 'BUILD_NUMBER=0 echo hi',
                result: false,
                skipped: true
            },
            {
                name: 'skip-dependencies',
                exec: false,
                result: false,
                skipped: true
            }
        ]);
    });

    it('can dry run', async () => {
        const test = new Task(database, doSomethingTask);
        expect(test).toBeDefined();
        expect(await test.dry(preferredTool)).toEqual([
            {
                name: 'does-something',
                exec: 'BUILD_NUMBER=0 echo hi',
                result: false,
                skipped: false
            }
        ]);
    });

    it('can have sibling dependencies', () => {
        const siblings = {
            name: 'root',
            tasks: [
                {
                    name: 'sibling'
                },
                {
                    name: 'other',
                    dependencies: ['sibling']
                }
            ]
        };
        const test = new Task(database, siblings);
        expect(test).toBeDefined();
        expect(test.tasks[1].tasks[0]).toBe(test.tasks[0]);
    });

    it('will skip if there is no exec for that tool', async () => {
        delete doSomethingTask.exec['docker-compose'];
        const test = new Task(database, doSomethingTask);
        expect(test).toBeDefined();
        expect(await test.shouldSkip(dockerCompose)).toBe(true);
    });

    it('will not skip if there is a constraint to always use a specific tool and it is told to ignore the preferred tool', async () => {
        doSomethingTask.constraints = {};
        doSomethingTask.constraints.always_use_tool = 'native';
        doSomethingTask.constraints.ignore_preferred_tool = true;
        const constraint = new Task(database, doSomethingTask);
        expect(constraint).toBeDefined();
        expect(await constraint.shouldSkip(dockerCompose)).toBe(false);
    });

    it('will exec the defined tool instead of the prefered tool when told to', async () => {
        doSomethingTask.constraints = {};
        doSomethingTask.constraints.always_use_tool = 'native';
        doSomethingTask.constraints.ignore_preferred_tool = true;
        const constraint = new Task(database, doSomethingTask);
        expect(constraint).toBeDefined();
        expect(await constraint.shouldSkip(dockerCompose)).toBe(false);
        expect(await constraint.dry(dockerCompose)).toEqual([
            {
                name: 'does-something',
                exec: 'BUILD_NUMBER=0 echo hi',
                result: false,
                skipped: false
            }
        ])
    });

    it('will skip if there is a constraint to always use a specific tool but not to ignore the preferred tool', async () => {
        doSomethingTask.constraints = {};
        doSomethingTask.constraints.always_use_tool = 'native';
        doSomethingTask.constraints.ignore_preferred_tool = false;
        const constraint2 = new Task(database, doSomethingTask);
        expect(constraint2).toBeDefined();
        expect(await constraint2.shouldSkip(dockerCompose)).toBe(true);
    });

    it('will skip if a file has not changed', async () => {
        database.fileChanged = jest.fn(async () => false);

        const task = new Task(database, sometimesSkips);
        expect(task).toBeDefined();
        expect(await task.shouldSkip(preferredTool)).toBe(true);
    });

    it('will not skip if a file has changed', async () => {
        database.fileChanged = jest.fn(async () => true);

        const task = new Task(database, sometimesSkips);
        expect(task).toBeDefined();
        expect(await task.shouldSkip(preferredTool)).toBe(false);
        expect(database.fileChanged.mock.calls.length).toBe(1);
    });

    it('will update the changed file list when executed', async () => {
        database.fileChanged = jest.fn(async () => true);
        database.updateFileSnapshot = jest.fn(async () => true);

        const task = new Task(database, sometimesSkips);
        expect(task).toBeDefined();
        expect(await task.shouldSkip(preferredTool)).toBe(false);
        expect(await task.execute(preferredTool)).toEqual([
            {
                exec: 'BUILD_NUMBER=0 echo hello world',
                name: 'sometimes-skips',
                result: 0,
                skipped: false
            }
        ]);
        expect(database.fileChanged.mock.calls.length).toBe(3);
        expect(database.updateFileSnapshot.mock.calls.length).toBe(1);
    });

    it('emits a build event', async () => {
        database.fileChanged = jest.fn(async () => true);
        database.updateFileSnapshot = jest.fn(async () => true);
        const emittedEvent = jest.fn();

        const bus = require('lib/bus').default;
        bus.on('task', (name) => {
            emittedEvent(name);
        });

        const task = new Task(database, sometimesSkips);
        expect(task).toBeDefined();
        expect(await task.shouldSkip(preferredTool)).toBe(false);
        expect(await task.execute(preferredTool)).toEqual([
            {
                exec: 'BUILD_NUMBER=0 echo hello world',
                name: 'sometimes-skips',
                result: 0,
                skipped: false
            }
        ]);
        expect(emittedEvent.mock.calls.length).toBe(1);
    });

    it('gives a list of children', () => {
        const siblings = {
            name: 'root',
            tasks: [
                {
                    name: 'sibling'
                },
                {
                    name: 'other',
                    dependencies: ['sibling']
                }
            ]
        };
        const task = new Task(database, siblings);
        expect(task.children()).toEqual([
            'sibling',
            'other'
        ])
    });

    it('wont skip important things', async () => {
        const root = {
            name: 'root',
            tasks: realLife
        };
        database.fileChanged = jest.fn(() => false);

        const task = new Task(database, root);
        expect(await task.dry(preferredTool)).toEqual([
            {
                exec: 'BUILD_NUMBER=0 npm install',
                name: 'dependencies',
                result: false,
                skipped: true
            },
            {
                exec: 'BUILD_NUMBER=0 npm run build-cli',
                name: 'build-cli',
                result: false,
                skipped: false
            },
            {
                exec: false,
                name: 'root',
                result: false,
                skipped: false
            }
        ]);
    });

    it('properly does a transitive reduction', () => {
        // this example tree taken from https://en.wikipedia.org/wiki/Transitive_reduction
        const example = {
            name: 'a',
            tasks: [
                {
                    name: 'b',
                    tasks: [],
                    dependencies: [
                        'd'
                    ]
                },
                {
                    name: 'c',
                    tasks: [],
                    dependencies: [
                        'd',
                        'e'
                    ]
                },
                {
                    name: 'd',
                    tasks: [
                        {
                            name: 'e'
                        }
                    ]
                }
            ],
            dependencies: [
                'e'
            ]
        };

        const task = new Task(database, example);
        task.reduce();

        expect(task.tasks.map(a => a.name)).toEqual(['b','c']);
        expect(task.search('b').tasks.map(a => a.name)).toEqual(['d']);
        expect(task.search('c').tasks.map(a => a.name)).toEqual(['d']);
        expect(task.search('d').tasks.map(a => a.name)).toEqual(['e']);
    });

    //todo: In the future, we could store the output and check that this test actually does something ...
    it('can set the working directory', async () => {
        doSomethingTask.exec.native.command = ['ls'];
        doSomethingTask.exec.native.working = 'assets';
        const test = new Task(database, doSomethingTask);
        expect(await test.execute(preferredTool)).toEqual([{"exec":"BUILD_NUMBER=0 ls ","name":"does-something","result":0,"skipped":false}]);
    });

    it('can set pass arguments', async () => {
        doSomethingTask.exec.native.command = ['ls'];
        doSomethingTask.exec.native.working = 'assets';
        doSomethingTask.exec.acceptsArgs = true;
        const test = new Task(database, doSomethingTask);
        expect(await test.execute(preferredTool)).toEqual([{"exec":"BUILD_NUMBER=0 ls ","name":"does-something","result":0,"skipped":false}]);
    });
});
