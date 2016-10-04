/**
 * @module lib/parser/parser
 */


/**
 *
 * In the perfect world, everything in an AST is based on the
 *
 * Let's talk about what this AST should look like:
 *
 * prefer: {}
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
     * @param {number} number
     * @return {*|boolean}
     * @private
     */
    _is(type, ch, number = 1) {
        const token = this._input.peek(number);
        return token && token.type == type && (!ch || token.value == ch);
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
    _parse(type = '') {
        let name;
        Log.trace(`Parsing ${type}`);
        switch(type) {
            default:
                name = this._input.next();
                if (name.type != type) this._input.die(`Expecting ${type}, but found ${name.type} (${name.value})`);
                return name.value;
            case 'bool':
                return this._input.next().value == "true"
            case 'value':
                if (this._is('var') || this._is('bool') || this._is('num') || this._is('string')) {
                    return {
                        type: 'value',
                        value: this._input.next().value
                    }
                }
                this._unexpected('invalid value');
                break;
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

    _parsePrefer() {
        this._expect('kw', 'prefer');
        if (this._is('var', 'default')) {
            this._expect('var', 'default');
            if (this._is('var')) {
                const tool = this._parse('var');
                return {
                    type: 'overrideToolStack',
                    perform: 'push',
                    right: tool
                };
            }
            return {
                type: 'toolStack',
                perform: 'pop'
            };
        }
        if (this._is('var')) {
            const tool = this._parse('var');
            return {
                type: 'toolStack',
                perform: 'push',
                right: tool
            };
        }
        this._unexpected('prefer cannot be by itself');
    }

    _parseSet() {
        this._expect('kw', 'set');
        const left = this._is('ident') ? this._parse('ident') : this._parse('switch');
        const right = this._is('ident') ? this._parse('ident') : this._parse('value');
        return {
            type: 'assign',
            left,
            right
        };
    }

    _parseTask() {
        this._expect('kw', 'task');
        let left = null;
        if (this._is('var')) {
            left = this._parse('var');
        }
        this._expect('punc', '{');
        const right = [];
        while(!this._is('punc', '}')) {
            right.push(this._parseAtom());
        }
        this._expect('punc', '}');
        return {
            type: 'task',
            left,
            right
        };
    }

    _parseAtom() {
        if (this._is('kw', 'prefer')) return this._parsePrefer();
        if (this._is('kw', 'set')) return this._parseSet();
        if (this._is('kw', 'task')) return this._parseTask();
    }
}

export default Parser;
