/**
 * @module lib/parser/inputStream
 */

class InputStream {
    constructor(file = '') {
        this._pos = 0;
        this._line = 1;
        this._col = 0;
        this._file = file;
    }

    /**
     * Read the next character in the stream
     * @return {string}
     */
    next() {
        const ch = this._file.charAt(this._pos++);

        if (ch == "\n") {
            this._line++;
            this._col = 0;
        }
        else {
            this._col++;
        }

        return ch;
    }

    /**
     * Peek at the next character in the stream
     * @return {string}
     */
    peek() {
        return this._file.charAt(this._pos);
    }

    /**
     * Returns true if next() is the end of the file
     * @return {boolean}
     */
    eof() {
        return this.peek() == '';
    }

    /**
     * Causes the parser to die a horrible death due to user error
     * @param {string} msg The message to fail with
     */
    die(msg) {
        throw new Error(`${msg} (${this._line}:${this._col})`);
    }
}

export default InputStream;
