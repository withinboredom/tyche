/**
 * This file originally created on 9/22/16
 */

import Task, {EvaluateAST} from '../task';

describe('an evaluator', () => {
    it('can evaluate a simple task', () => {
        const task = {
            type: 'task',
            value: 'simple-task',
            body: [
                {
                    type: 'description',
                    value: 'hello world'
                },
                {
                    type: 'task',
                    value: 'subtask',
                    body: [
                        {type: 'description', value: 'do nothing'}
                    ]
                }
            ]
        };

        const env = new Task();
        EvaluateAST(task, env);

        // create the expected environment
        const expectedTask = new Task();

        // define the simple task
        const simple = new Task(expectedTask);
        simple.defineVar('description', 'hello world');

        // define the subtask
        const subtask = new Task(simple);
        subtask.defineVar('description', 'do nothing');

        // attach the subtask to the simple task
        simple.defineVar('subtask', subtask);
        // and the simple task to the expected task
        expectedTask.defineVar('simple-task', simple);

        expect(env).toEqual(expectedTask);
    });
    it('can evaluate a simple exec block', () => {
        const exec = {
            type: 'exec',
            value: 'native',
            body: [
                {
                    type: 'command',
                    value: 'git checkout master'
                }
            ]
        };
        const env = new Task();
        EvaluateAST(exec, env);
        const expected = new Task();
        expected.exec = {
            native: () => 'git checkout master'
        };

        expect(env.exec.native()).toBe(expected.exec.native());
    });
    it('can evaluate a simple ref block', () => {
        const ref = {
            type: 'ref',
            value: 'test',
            body: []
        };

        const task1 = {
            type: 'task',
            value: 'task1',
            body: [
                ref
            ]
        };

        const test = {
            type: 'task',
            value: 'test',
            body: []
        };

        const body = {
            type: 'task',
            value: 'root',
            body: [
                task1,
                test
            ]
        };

        const env = new Task();
        EvaluateAST(body, env);

        expect(env.getValue('root').getValue('task1').getValue('ref-test')()).toBe(env.getValue('root').getValue('test'));
    });
    it('can evaluate an and/or block', () => {
        const andskip = {
            type: 'and',
            negative: false,
            action: 'skip',
            what: 'changed',
            body: [
                'package.json'
            ]
        };
        const andconstrain = {
            type: 'or',

        }
        const task = {
            type: 'task',
            value: 'test',
            body: [
                andskip
            ]
        };

        const env = new Task();
        EvaluateAST(task, env);
        const skipper = jest.fn();
        env.getValue('test').getValue('skips')[0](skipper);
        expect(skipper.mock.calls).toEqual([[ 'package.json', 'changed', false ]]);
    })
});