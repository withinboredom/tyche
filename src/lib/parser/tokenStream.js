const keywords = [
    'ref',
    'and',
    'or',
    'defaultTool',
    'revert',
    'true',
    'false',
    'exec',
    'wait'
];

class TokenStream {
    /**
     * Creates a new token stream
     * @param {InputStream} input
     */
    constructor(input) {
        this._input = input;
        this._current = null;
    }

    peek() {
        if (!this._current) this._current = this._readNext(this._input);
        return this._current;
    }

    next() {
        const token = this._current;
        this._current = null;
        return token || this._readNext(this._input);
    }

    eof() {
        return this.peek() == null;
    }

    die(msg) {
        return this._input.die(msg);
    }

    /**
     * Is something a keyword?
     * @param {string} word
     * @return {boolean}
     * @private
     */
    _isKeyword(word) {
        return keywords.indexOf(word) >= 0;
    }

    _isBool(word) {
        return this._isKeyword(word) ? word == 'true' || word == 'false' : false;
    }

    /**
     * Is something a digit?
     * @param {string} ch
     * @return {boolean}
     * @private
     */
    _isDigit(ch) {
        return /[0-9]/i.test(ch);
    }

    /**
     * Is this the start of an identifier?
     * @param {string} ch
     * @return {boolean}
     * @private
     */
    _isStartOfIdentifier(ch) {
        return /[a-z|-]/i.test(ch);
    }

    /**
     * Is this an identifier?
     * @param {string} ch
     * @return {boolean}
     * @private
     */
    _isIdentifier(ch) {
        return this._isStartOfIdentifier(ch) || "?!<>=0123456789-_".indexOf(ch) >= 0;
    }

    /**
     * Is this punctuation?
     * @param {string} ch
     * @return {boolean}
     * @private
     */
    _isPuncuation(ch) {
        return ".:(){}[]".indexOf(ch) >= 0;
    }

    /**
     * Is this white space?
     * @param {string} ch
     * @return {boolean}
     * @private
     */
    _isWhiteSpace(ch) {
        return " \n\t\r".indexOf(ch) >= 0;
    }

    /**
     * Reads from the inputstream as long as the predicate is true
     * @param {function} predicate
     * @return {string}
     * @private
     */
    _readWhile(predicate) {
        let str = "";
        while(!this._input.eof() && predicate(this._input.peek())) {
            str += this._input.next();
        }
        return str;
    }

    /**
     * Reads a number from a stream
     * @return {{type: string, value: Number}}
     * @private
     */
    _readNumber() {
        let hasDot = false;
        const number = this._readWhile((ch) => {
            if (ch === '.') {
                if (hasDot) return false;
                hasDot = true;
                return true;
            }
            return this._isDigit(ch);
        });
        return { type: 'num', value: parseFloat(number)};
    }

    /**
     * Reads an identifier from the stream
     * @return {{type: string, value: string}}
     * @private
     */
    _readIdentifier() {
        const value = this._readWhile((ch) => this._isIdentifier(ch));
        let type;
        if (this._isBool(value)) {
            type = 'bool'
        }
        else if (this._isKeyword(value)) {
            type = 'kw'
        }
        else {
            type = 'var';
        }
        return {type, value};
    }

    /**
     * Read an escaped character
     * @param {string|undefined} end The end of the escaped string
     * @return {string}
     * @private
     */
    _readEscaped(end) {
        let escaped = false, str = '';
        this._input.next();
        while(!this._input.eof()) {
            const ch = this._input.next();
            if (escaped) {
                str += ch;
                escaped = false;
            }
            else if (ch == "\\") {
                escaped = true;
            }
            else if (ch == end) break;
            else str += ch;
        }

        return str;
    }

    /**
     * Reads a string from the stream
     * @return {{type: string, value: string}}
     * @private
     */
    _readString() {
        return {type: 'string', value: this._readEscaped('"')};
    }

    /**
     * Skip a comment line
     * @private
     */
    _skipComments() {
        this._readWhile((ch) => {
            return ch != "\n";
        });
        this._input.next();
    }

    _readNext() {
        this._readWhile((ch) => this._isWhiteSpace(ch));
        if (this._input.eof()) return null;
        let ch = this._input.peek();
        if (ch == "#") {
            this._skipComments();
            return this._readNext();
        }
        if (ch == '"') return this._readString();
        if (this._isDigit(ch)) return this._readNumber();
        if (this._isStartOfIdentifier(ch)) return this._readIdentifier();
        if (this._isPuncuation(ch)) return {type: 'punc', value: this._input.next()};
        this._input.die(`Can't handle character: ${ch}`);
    }
}

export default TokenStream;
