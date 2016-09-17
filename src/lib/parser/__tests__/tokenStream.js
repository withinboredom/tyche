import InputStream from 'lib/parser/inputStream';
import TokenStream from 'lib/parser/tokenStream';

const file = `
# This is an example file
# and this is a comment
defaultTool: native

"a string"

example-task {
    "does \\\"nothing\\\""
    example: 123.5
}
`;

const invalidFile = `
#this is an invalid file
;;;asdfasd fasdsakdf asdkjf askdjfnsdlkjn
@$%@#!$@
`;

describe('a token stream', () => {
    let input;

    beforeEach(() => {
        input = new InputStream(file);
    });

    it('can be defined', () => {
        const t = new TokenStream(input);
        expect(t).toBeDefined();
    });

    it('can read a string', () => {
        const t = new TokenStream(new InputStream(`"does \\\"nothing\\\""`));
        expect(t.next()).toEqual({type: 'string', value: "does \"nothing\""});
    });

    it('can peek at a token', () => {
        const t = new TokenStream(input);
        expect(t.peek()).toBe(t.next());
    });

    it('can read lex a file without failing', () => {
        const t = new TokenStream(input);
        while(!t.eof()) {
            expect(t.peek()).toBe(t.next());
        }
    });

    it('fails to lex an invalid file', () => {
        const t = new TokenStream(new InputStream(invalidFile));
        expect(() => {
            while(!t.eof()) {
                t.next();
            }
        }).toThrow();
    });

    it('can delibirately die', () => {
        const t = new TokenStream(input);
        expect(() => t.die('hi')).toThrow();
    })
})
