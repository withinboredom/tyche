import db from '../';
import fs from 'fs';

const testDbFile = './test.json';

function cleanupTestDb() {
    try {
        fs.unlinkSync(testDbFile);
    } catch(e) {
        // do nothing
    }
}

describe('database interface', () => {
    beforeEach(cleanupTestDb);
    afterEach(cleanupTestDb);

    it('fails if not initialized', () => {
        const test = new db('something.json');
        expect(test).toBeDefined();
        expect(() => test.db).toThrow('Database has not been initialized!');
    });

    it('can be initialized', async () => {
        const test = new db(testDbFile);
        expect(test).toBeDefined();
        await test.initializeDb();
        expect(() => test.db).not.toThrow();
    });

    it('keeps track of the current build number', async () => {
        const test = new db(testDbFile);
        expect(test).toBeDefined();
        await test.initializeDb();
        expect(test.buildNumber).toBe(0);
        test.buildNumber = 3;
        expect(test.buildNumber).toBe(3);
    });

    it('always thinks the first discovery of a file is a change', async () => {
        const test = new db(testDbFile);
        expect(test).toBeDefined();
        await test.initializeDb();
        expect(await test.fileChanged('./package.json')).toBe(true);
    });

    it('is consistent, per run, whether a file has changed', async () => {
        const test = new db(testDbFile);
        expect(test).toBeDefined();
        await test.initializeDb();
        expect(await test.fileChanged('./package.json')).toBe(true);
        expect(await test.fileChanged('./package.json')).toBe(true);
    });

    it('knows when its a different run', async () => {
        const first = new db(testDbFile);
        await first.initializeDb();
        expect(await first.fileChanged('./package.json')).toBe(true);
        await first.updateFileSnapshot('./package.json');
        await first.finish();

        const second = new db(testDbFile);
        await second.initializeDb();
        expect(await second.fileChanged('./package.json')).toBe(false);
    });

    it('does not save the file state unless told to', async () => {
        const first = new db(testDbFile);
        await first.initializeDb();
        expect(await first.fileChanged('./package.json')).toBe(true);
        await first.finish();

        const second = new db(testDbFile);
        await second.initializeDb();
        expect(await second.fileChanged('./package.json')).toBe(true);
    });

    it('detects file changes', async () => {
        const first = new db(testDbFile);
        await first.initializeDb();
        expect(await first.fileChanged(testDbFile)).toBe(true);
        await first.updateFileSnapshot(testDbFile);
        await first.finish();

        const second = new db(testDbFile);
        await second.initializeDb();
        expect(await second.fileChanged(testDbFile)).toBe(true);
    });

    it('never thinks directories are changed', async () => {
        const first = new db(testDbFile);
        await first.initializeDb();
        expect(await first.fileChanged(__dirname)).toBe(false);
        await first.finish();
    });
});
