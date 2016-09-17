import stream from 'lib/parser/inputStream';

const file = `abcd

123`;

describe('inputStream', () => {
    it('returns something', () => {
        expect(new stream(file)).toBeDefined();
    });

    it('can peek', () => {
        const s = new stream(file);
        expect(s.peek()).toBe('a');
    });
    it('can read a file', () => {
        const r = [];
        const s = new stream(file);
        while(!s.eof()) {
            r.push(s.next());
        }
        expect(r.join('')).toBe(file);
    });
    it('will fail when told to', () => {
        const s = new stream(file);
        expect(s.die).toThrow();
    });
    it('can handle empty files', () => {
        const s = new stream('');
        expect(s.eof()).toBe(true);
    });
    it('can handle null files', () => {
        const s = new stream();
        expect(s.eof()).toBe(true);
    })
});
