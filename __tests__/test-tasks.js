jest.disableAutomock();

import createTasks from '../src/lib/config/task';

const taskList = [{
    name: "test",
    description: "a description",
    tasks: [
        {
            name: "dep",
            description: "a dep",
            exec: {
                base: {
                    command: "nothing"
                }
            }
        }
    ]
}];

describe('tasks', () => {
    it('can give tasks from sane json', async () => {
        const tasks = createTasks(taskList);
        expect(tasks.length).toBe(2);
    });

})
