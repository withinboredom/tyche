jest.disableAutomock();

import {hashFile, hashFileList} from '../src/lib/config/hash';

describe('hash file tests', () => {
    it('can hash a single file', async () => {
        const hash = await hashFile(`${__dirname}/../assets/tests/configs/simple-config.json`);
        expect(hash.digest).toBe('ae42b67fe6dbdc27e0de2e8d8f3cdc9a6288ae884a2166f9fa9d9804056a57a3');
    });
    it('fails if the file does not exist', async () => {
        try {
            await hashFile(`nope`);
        } catch(e) {
            expect(e).toBeDefined();
        }
    });
});

describe('hash list tests', () => {
    it('can handle one file', async () => {
        const files = [`${__dirname}/../assets/tests/configs/simple-config.json`];
        const hashes = await hashFileList(files);
        expect(hashes.length).toBe(1);
    });
    it('can handle multiple files', async () => {
        const files = [`${__dirname}/../assets/tests/configs/simple-config.json`];
        files.push(...files);
        const hashes = await hashFileList(files);
        expect(hashes.length).toBe(2);
    });
    it('can be an empty list', async () => {
        const files = [];
        const hashes = await hashFileList(files);
        expect(hashes.length).toBe(0);
    });
    it('can contain non-existent files', async () => {
        const files = [`${__dirname}/../assets/tests/configs/simple-config.json`, 'none'];
        const hashes = await hashFileList(files);
        console.log(hashes);
        expect(hashes.length).toBe(2);
    });
})
