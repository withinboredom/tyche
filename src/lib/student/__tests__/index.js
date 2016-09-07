/**
 * These tests describe how a study works
 */
import Student from '../';

const commit = [{
    "on": "commit",
    "watch": [
        "tyche.json",
        "package.json",
        "src/**/*"
    ],
    "message": {
        "warn": "It looks like you forgot to build this commit, maybe you should do that?"
    },
    "reset": [
        "build",
        "watch"
    ]
}];

describe('studies', () => {
    const database = {};

    it('can be defined', () => {
        const student = new Student(database, commit);
        expect(student).toBeDefined();
    });

    it('can count files', async () => {
        const student = new Student(database, commit);
        expect(await student.countFiles()).toBeGreaterThan(0);
    });

    it('can scan a bunch of files for changes', async () => {
        const student = new Student(database, commit);
        database.fileChanged = jest.fn(async () => false);
        expect(await student.scan()).toEqual({
            changes: 0,
            totalFilesScanned: await student.countFiles()
        });
        expect(await student.scan()).toEqual({
            changes: 0,
            totalFilesScanned: await student.countFiles()
        });
    });

    it('responds to task completions', async () => {
        const bus = require('lib/bus').default;
        commit[0].reset.push('test');
        const student = new Student(database, commit);
        database.fileChanged = jest.fn(async () => true);
        database.updateFileSnapshot = jest.fn();
        await student.scan();
        bus.emit('task', 'test', 0);
        expect(database.updateFileSnapshot.mock.calls.length).toBeGreaterThan(0);
    })

});
