import InputStream from 'lib/parser/inputStream';
import TokenStream from 'lib/parser/tokenStream';
import Parser from 'lib/parser/parser';

/**
 * These tests test internal functions of the parser. Due to the nature of the parser (tokens go in --> ast comes out)
 * It just makes sense to verify that various tokens result in correct ast.
 */

describe('the parser', () => {

    const getParserFor = (str) => {
        return new Parser(new TokenStream(new InputStream(str)));
    };

    it('can peek check a type', () => {
        const parser = getParserFor('task test {}');

        // positive tests
        expect(parser._is('kw')).toBe(true);
        expect(parser._is('kw', 'task')).toBe(true);
        expect(parser._is('var', 'test', 2)).toBe(true);
        expect(parser._is('var', 'nope')).toBe(false);

        //negative tests
        expect(parser._is('string')).toBe(false);
        expect(parser._is('string', 'something')).toBe(false);
        expect(parser._is('string', 'test')).toBe(false);
    });

    it('can expect a type', () => {
        const parser = getParserFor('task test {}');

        expect(() => parser._expect('kw', 'task')).not.toThrow();
        expect(() => parser._expect('var', 'test')).not.toThrow();
        expect(() => parser._expect('punc')).not.toThrow();
        expect(() => parser._expect('kw')).toThrow();
    });

    it('can fail unexpectedly', () => {
        const parser = getParserFor('task test {}');
        expect(() => parser._unexpected()).toThrow();
    });

    it('can parse a bool', () => {
        const parser = getParserFor('true false');
        expect(parser._parse('bool')).toBe(true);
        expect(parser._parse('bool')).toBe(false);
    });

    it('can parse prefer', () => {
        const fail = getParserFor('prefer');
        const pass1 = getParserFor('prefer default native');
        const pass2 = getParserFor('prefer default');
        const pass3 = getParserFor('prefer native');

        expect(() => fail._parsePrefer()).toThrow();
        expect(pass1._parsePrefer()).toEqual({
            type: 'overrideToolStack',
            perform: 'push',
            right: 'native'
        });
        expect(pass2._parsePrefer()).toEqual({
            type: 'toolStack',
            perform: 'pop'
        });
        expect(pass3._parsePrefer()).toEqual({
            type: 'toolStack',
            perform: 'push',
            right: 'native'
        })
    });

    it('can parse set', () => {
        const fail1 = getParserFor('set x = 1');
        const fail2 = getParserFor('set x 1');
        const fail3 = getParserFor('set');
        const pass1 = getParserFor('set $x 1');
        const pass2 = getParserFor('set $x "-e"');
        const pass3 = getParserFor('set -e hello');
        const pass4 = getParserFor('set -e $x');
        const pass5 = getParserFor('set -e "hello"');

        expect(() => fail1._parseSet()).toThrow();
        expect(() => fail2._parseSet()).toThrow();
        expect(() => fail3._parseSet()).toThrow();
        expect(pass1._parseSet()).toEqual({
            type: 'assign',
            left: '$x',
            right: {
                type: 'value',
                value: 1
            }
        });
        expect(pass2._parseSet()).toEqual({
            type: 'assign',
            left: '$x',
            right: {
                type: 'value',
                value: '-e'
            }
        });
        expect(pass3._parseSet()).toEqual({
            type: 'assign',
            left: '-e',
            right: {
                type: 'value',
                value: 'hello'
            }
        });
        expect(pass4._parseSet()).toEqual({
            type: 'assign',
            left: '-e',
            right: '$x'
        });
        expect(pass5._parseSet()).toEqual({
            type: 'assign',
            left: '-e',
            right: {
                type: 'value',
                value: 'hello'
            }
        });
    })
});