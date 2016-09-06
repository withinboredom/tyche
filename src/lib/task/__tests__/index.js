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

const preferredTool = toolMachine('native');
const dockerCompose = toolMachine('docker-compose');

describe('tasks', () => {
    let database = null;
    beforeEach(() => {
        database = {
            buildNumber: 0
        };
    });

    it('can be described', () => {
        expect(() => new Task(database, doNothingTask)).not.toThrow();
    });

    it('can execute a task', async () => {
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
    })

    it('will skip if there is a constraint to always use a specific tool but not to ignore the preferred tool', async () => {
        doSomethingTask.constraints = {};
        doSomethingTask.constraints.always_use_tool = 'native';
        doSomethingTask.constraints.ignore_preferred_tool = false;
        const constraint2 = new Task(database, doSomethingTask);
        expect(constraint2).toBeDefined();
        expect(await constraint2.shouldSkip(dockerCompose)).toBe(true);
    });

    it('will skip if a file has not changed', async () => {
        database.fileChanged = jest.fn((file) => false);

        const task = new Task(database, sometimesSkips);
        expect(task).toBeDefined();
        expect(await task.shouldSkip(preferredTool)).toBe(true);
    });

    it('will not skip if a file has changed', async () => {
        database.fileChanged = jest.fn((file) => true);

        const task = new Task(database, sometimesSkips);
        expect(task).toBeDefined();
        expect(await task.shouldSkip(preferredTool)).toBe(false);
        expect(database.fileChanged.mock.calls.length).toBe(1);
    });
});
