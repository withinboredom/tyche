import load, {getFilesCollection} from '../db';

describe('can get dbs and stuff', () => {
    it('can do things', async () => {
        const db = await load();
        expect(db).toBeDefined();
    });
    it('can get a files collection', async () => {
        const db = await load();
        const collection = await getFilesCollection(db);
        collection.insert({file: 'test'});
        const result = collection.by('file', 'test');
        expect(result.file).toBe('test')
    });
});
