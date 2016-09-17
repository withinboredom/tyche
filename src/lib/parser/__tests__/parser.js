import InputStream from '../inputStream';
import TokenStream from '../tokenStream';
import Parser from '../parser';

const file = `
# This is an example file with every possible feature and every possible way
defaultTool: test                   

test-task {                         
    "description \\goes here"       
    and skip all: true              
    sub_task {                      
        "a tiny task"               
        exec native: "echo hi"
        revert native: "echo revert"
        and skip if exists: "node_modules"
		and skip all: true
		and skip if not changed {
			"package.json"
		}
		and always use native
	    or ignore preferred tool
    }                               
    exec native {                   
        "echo more complex"         
         working: "./src"       
         something: 123
    }
    ref ok
}                                   
`;

describe('the parser', () => {
    let tokens;
    beforeEach(() => {
        tokens = new TokenStream(new InputStream(file));
    });

    it('can be defined', () => {
        expect(new Parser(tokens)).toBeDefined();
    });

    it('can read a valid file to an ast', () => {
        const p = new Parser(tokens);
        // this is just a snapshot to help you figure out what you changed ...
        expect(p.parse()).toEqual(
            [{"type":"DefaultTool","value":"test"},{"type":"task","value":"test-task","body":[{"type":"description","value":"description goes here"},{"type":"and","negative":false,"action":"skip","what":"all","body":{"type":"bool","value":false}},{"type":"task","value":"sub_task","body":[{"type":"description","value":"a tiny task"},{"type":"exec","value":"native","body":[{"type":"command","value":"echo hi"}]},{"type":"revert","value":"native","body":[{"type":"command","value":"echo revert"}]},{"type":"and","negative":false,"action":"skip","what":"exists","body":["node_modules"]},{"type":"and","negative":false,"action":"skip","what":"all","body":{"type":"bool","value":false}},{"type":"and","negative":true,"action":"skip","what":"changed","body":["package.json"]},{"type":"and","negative":false,"action":"constrain","what":"always_tool","body":"native"},{"type":"or","negative":false,"action":"constrain","what":"preferred_tool","body":[]}]},{"type":"exec","value":"native","body":[{"type":"command","value":"echo more complex"},{"type":"option","value":"working","body":"./src"},{"type":"option","value":"something","body":123}]},{"type":"ref","value":"ok"}]}]
        );
    });

    it('fails on unexpected input', () => {
        expect(() => {
            new Parser(new TokenStream(new InputStream(`
"break"
`).parse())).toThrow();
        })
    });

    it('fails to parse an atom', () => {
        expect(() => {
            new Parser(new TokenStream(new InputStream('}')))._parseAtom();
        }).toThrow();
    });

    it('fails to skip something', () => {
        expect(() => {
            new Parser(new TokenStream(new InputStream('hello {')))._skip('ref');
        }).toThrow();
    });

});
