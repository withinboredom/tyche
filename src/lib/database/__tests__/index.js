import db from '../';
import fs from 'fs';

jest.mock('lokijs');

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
        cleanupTestDb();
        const test = new db(testDbFile);
        expect(test).toBeDefined();
        await test.initializeDb();
        expect(() => test.db).not.toThrow();
    })
});
