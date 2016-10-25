import InputStream from 'lib/parser/inputStream';
import TokenStream from 'lib/parser/tokenStream';

const read = (file) => {
    return new InputStream(file);
};

describe('a token stream', () => {

    it('can be defined', () => {
        const t = new TokenStream(read(''));
        expect(t).toBeDefined();
    });

    it('can detect a keyword', () => {
        const valid = 'if',
            invalid = 'test',
            t = new TokenStream(read(''));
        expect(t._isKeyword(valid)).toBe(true);
        expect(t._isKeyword(invalid)).toBe(false);
    });

    it('can detect a bool', () => {
        const valid_t = 'true',
            valid_f = 'false',
            invalid = 'blah',
            t = new TokenStream(read(''));
        expect(t._isBool(valid_t)).toBe(true);
        expect(t._isBool(valid_f)).toBe(true);
        expect(t._isBool(invalid)).toBe(false);
    });

    it('can detect a number', () => {
        const valid = '0',
            invalid = 'test',
            t = new TokenStream(read(''));
        expect(t._isDigit(valid)).toBe(true);
        expect(t._isDigit(invalid)).toBe(false);
    });

    it('can detect an ident', () => {
        const valid = '-crumple',
            invalid = '?',
            t = new TokenStream(read(''));
        expect(t._isIdentifier(valid)).toBe(true);
        expect(t._isIdentifier(invalid)).toBe(false);
    });

    it('can detect punctuation', () => {
        const valid = ':',
            invalid = '-',
            t = new TokenStream(read(''));
        expect(t._isPuncuation(valid)).toBe(true);
        expect(t._isPuncuation(invalid)).toBe(false);
    });
});
