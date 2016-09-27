/**
 * @module lib/parser/parser
 */


/**
 *
 * In the perfect world, everything in an AST is based on the
 *
 * Let's talk about what this AST should look like:
 *
 *
 */

import Logger from 'lib/logger';

const Log = Logger.child({
    component: 'Parser'
});

class Parser {
    /**
     * Creates a parser
     * @param {TokenStream} tokenStream
     */
    constructor(tokenStream) {
        this._input = tokenStream;
    }

    /**
     * Check for type, maybe matching ch
     * @param {string} type
     * @param {string} [ch]
     * @return {*|boolean}
     * @private
     */
    _is(type, ch) {
        const token = this._input.peek();
        return token && token.type == type && (!ch || token.value == ch) && token;
    }

    /**
     * Skips a token, optionally checking that its valid
     * @param {string} type
     * @param {string} [ch]
     * @private
     */
    _expect(type, ch) {
        Log.trace(`Expecting ${type}, with value: ${ch}`);
        if(this._is(type, ch)) this._input.next();
        else this._input.die(`Expecting ${type}: ${ch}`);
    }

    /**
     * Declare something unexpected was found
     * @param {string} [reason]
     * @private
     */
    _unexpected(reason) {
        this._input.die(`Unexpected token: ${JSON.stringify(this._input.peek())} -- ${reason ? reason : ''}`);
    }

    /**
     * Read a token's value, while enforcing token type
     * @param {string} type
     * @return {*}
     * @private
     */
    _parse(type) {
        let name;
        Log.trace(`Parsing ${type}`);
        switch(type) {
            default:
                name = this._input.next();
                if (name.type != type) this._input.die(`Expecting ${type}, but found ${name.type} (${name.value})`);
                return name.value;
            case 'bool':
                return this._input.next() == "true"
        }
    }

    /**
     * Parse a default tool
     * @return {{type: string, value: ({type, value}|*)}}
     * @private
     */
    _parseDefaultTool() {
        Log.trace(`Parsing defaultTool block`);
        this._expect('kw', 'defaultTool');
        this._expect('punc', ':');
        return {
            type: 'DefaultTool',
            value: this._parse('var')
        }
    }

    /**
     * Try to parse something, and if it fails, its an identity function
     * @param {string} type
     * @param {TokenStream} input
     * @return {*}
     * @private
     */
    _maybeParse(type, input) {
        Log.trace(`Attempting to parse ${type}`);
        if(!input.peek) return input;
        if(this._is(type)) {
            Log.trace(`Discovered type ${type}`);
            return this._parse(type);
        }
        Log.trace(`Couldn't parse ${type}`);
        return input;
    }

    /**
     * Parse an exec block
     * @param {boolean} [revert=false]
     * @return {{Type: string, value: string, body: []}}
     * @private
     */
    _parseExec(kind) {
        Log.trace(`Attempting to parse exec block`);
        const type = kind;
        this._expect('kw',type);
        const value = this._parse('var');
        if (this._is('punc', ':')) {
            this._expect('punc',':');
            const body = [{type: 'command', value: this._parse('string')}];
            return {
                type,
                value,
                body
            }
        }
        this._expect('punc', '{');
        const body = [];
        while(!this._is('punc', '}')) {
            if (this._is('string')) body.push({type:'command', value: this._parse('string')});
            else {
                const value = this._parse('var');
                this._expect('punc', ':');
                const b = this._maybeParse('bool', this._maybeParse('num', this._maybeParse('string', this._input)));
                body.push({
                    type: 'option',
                    value,
                    body: b
                });
            }
        }
        this._expect('punc', '}');
        return {
            type,
            value,
            body
        };
    }

    /**
     * Parse a ref block
     * @return {{type: string, value: ({type, value}|*)}}
     * @private
     */
    _parseRef() {
        Log.trace(`Attempting to parse ref block`);
        this._expect('kw', 'ref');
        const value = this._parse('var');
        let body = {};
        if (this._is('punc', '{')) {
            this._expect('punc', '{');
            while(!this._input.eof() && !this._is('punc', '}')) {
                body = this._parseAtom();
            }
            this._expect('punc', '}');
        }
        return {
            type: 'ref',
            value,
            body
        };
    }

    /**
     * Parse a list
     * @return {Array}
     * @private
     */
    _parseList() {
        Log.trace(`Attempting to parse List block`);
        const result = [];
        if(this._is('punc', ':')) {
            this._expect('punc', ':');
            result.push(this._parse('string'));
        }
        if (this._is('punc', '{')) {
            this._expect('punc', '{');
            while(!this._is('punc', '}')) {
                result.push(this._parse('string'));
            }
            this._expect('punc', '}');
        }
        return {
            type: 'list',
            value: result
        };
    }

    /**
     * parse an and/or block
     * @return {{type, negative, action, what, body}|*}
     * @private
     */
    _parseAndOr() {
        Log.trace(`Attempting to parse conditional branch`);
        let type = 'or';
        let action = 'skip';
        let what = 'all';
        let negative = false;
        let body = {};

        function done() {
            return {
                type,
                negative,
                action,
                what,
                body
            };
        }

        if (this._is('kw', 'and')) {
            type = 'and';
            this._expect('kw', 'and');
        }
        else this._expect('kw', 'or');

        if(this._is('var', 'skip')) {
            this._expect('var', 'skip');
            action = 'skip';
            if(this._is('var', 'all')) {
                this._expect('var', 'all');
                what = 'all';
                this._expect('punc', ':');
                body = this._parse('bool');
                return done();
            }
            this._expect('var', 'if');
            if(this._is('var', 'not')) {
                negative = true;
                this._expect('var', 'not');
            }

            switch(this._input.peek().value) {
                case 'changed':
                    what = 'changed';
                    this._expect('var', 'changed');
                    body = this._parseList();
                    return done();
                case 'exists':
                    what = 'exists';
                    this._expect('var', 'exists');
                    body = this._parseList();
                    return done();
            }
        }

        if (this._is('var', 'always')) {
            this._expect('var','always');
            this._expect('var', 'use');
            action = 'constrain';
            what = 'always_tool';
            body = this._parse('var');
            return done();
        }

        if (this._is('var', 'ignore')) {
            this._expect('var', 'ignore');
            this._expect('var', 'preferred');
            this._expect('var', 'tool');
            action = 'constrain';
            what = 'preferred_tool';
            return done();
        }
    }

    /**
     * Parses a study block
     * @return {{type: string, value: *, body: Array}}
     * @private
     */
    _parseStudy() {
        Log.trace(`Attempting to parse study block`);
        this._expect('kw', 'study');
        const value = this._parse('var');
        const body = [];
        this._expect('punc', '{');
        while(!this._is('punc', '}')) {
            if (this._is('var', 'watch')) {
                this._expect('var', 'watch');
                body.push({type: 'watch', value: this._parseList()});
                continue;
            }
            if (this._is('var', 'warn')) {
                this._expect('var', 'warn');
                this._expect('punc', ':');
                body.push({type: 'warn', value: this._parse('string')});
                continue;
            }
            if (this._is('var', 'error')) {
                this._expect('var', 'error');
                this._expect('punc', ':');
                body.push({type: 'error', value: this._parse('string')});
                continue;
            }
            if (this._is('kw','ref')) {
                body.push(this._parseRef());
                continue;
            }
            this._unexpected();
        }
        this._expect('punc', '}');
        return {
            type: 'study',
            value,
            body
        }
    }

    /**
     * Break everything up into its smallest components
     * @return {*}
     * @private
     */
    _parseAtom() {
        Log.trace(`Parsing atom`);
        if (this._is('kw','defaultTool')) return this._parseDefaultTool();
        if (this._is('var')) {
            const value = this._parse('var');
            this._expect('punc', '{');
            const body = this._parseTask();
            this._expect('punc', '}');
            return {
                type: 'task',
                value,
                body
            }
        }
        if (this._is('string')) return {
            type: 'description',
            value: this._parse('string')
        };
        if (this._is('kw', 'exec')) return this._parseExec('exec');
        if (this._is('kw', 'revert')) return this._parseExec('revert');
        if (this._is('kw', 'wait')) return this._parseExec('wait');
        if (this._is('kw', 'ref')) return this._parseRef();
        if (this._is('kw', 'and') || this._is('kw', 'or')) return this._parseAndOr();
        if (this._is('kw', 'study')) return this._parseStudy();
        this._unexpected();
    }

    /**
     * Parses a task
     * @return {Array}
     * @private
     */
    _parseTask() {
        Log.trace(`Parsing task`);
        const body = [];
        while(!this._input.eof() && !this._is('punc', '}')) {
            body.push(this._parseAtom());
        }
        return body;
    }

    /**
     * Parse a whole file
     * @return {Array}
     */
    parse() {
        const tasks = [];
        while(!this._input.eof()) {
            tasks.push(this._parseAtom());
        }
        return {
            type: 'task',
            value: null,
            body: tasks
        };
    }
}

export default Parser;
