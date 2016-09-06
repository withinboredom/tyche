import Task from '../';
import Database from '../../database';
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
        path_exists: './node_modules'
    }
};

const sometimesSkips = {
    name: 'sometimes-skips',
    description: 'will skip if test file has not changed',
    skips: {
        files_not_changed: './test-file.json'
    }
};

const skipDeps = {
    name: 'skip-dependencies',
    description: 'always skip dependencies',
    skips: {
        skip_dependencies_if_skip: true,
        path_exists: './node_modules'
    }
};

const preferredTool = toolMachine('native');

describe('tasks', () => {
    let database = null;
    beforeEach(() => {
        database = new Database('./test-task.json');
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
                exec: 'echo hi',
                result: 0,
                skipped: false
            }
        ]);
    });

    it('can know whether or not to skip itself', () => {
        const test = new Task(database, skipsAlways);
        expect(test).toBeDefined();
        expect(test.shouldSkip(preferredTool)).toBe(true);

        const never = new Task(database, doNothingTask);
        expect(never).toBeDefined();
        expect(never.shouldSkip(preferredTool)).toBe(false);
    });

    it('can skip its dependencies', async () => {
        const tasks = skipDeps;
        tasks.tasks = [
            doSomethingTask
        ];

        const test = new Task(database, tasks);
        expect(test).toBeDefined();
        expect(test.shouldSkip(preferredTool)).toBe(true);
        expect(await test.dry(preferredTool)).toEqual([
            {
                name: 'does-something',
                exec: 'echo hi',
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
                exec: 'echo hi',
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
    })
});
