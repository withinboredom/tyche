import path from 'path';
const fs = jest.genMockFromModule('fs');
import {Readable, Writable} from 'stream';

let mockFiles = Object.create(null);
function __setMockFiles(newMockFiles) {
    mockFiles = Object.create(null);
    for (const file in newMockFiles) {
        const dir = path.dirname(file);

        if (!mockFiles[dir]) {
            mockFiles[dir] = [];
        }
        mockFiles[dir].push({
            basename: path.basename(file),
            contents: newMockFiles[file]
        });
    }
}

function readdirSync(directoryPath) {
    return mockFiles[directoryPath] || [];
}


function accessSync(file) {
    if (!mockFiles[path.dirname(file)]) {
        throw new Error();
    }

    if(mockFiles[path.dirname(file)].filter(target => target.basename === path.basename(file)).length === 0) {
        throw new Error();
    }
}

class FakeReadStream extends Readable {
    constructor(data, options) {
        super(options);
        this.cursor = 0;
        this.data = data;
    }

    _read(size) {
        const howMuch = this.data.length - this.cursor >= size ? size : this.data.length - this.cursor;
        const data = this.data.slice(this.cursor, howMuch);
        this.cursor += howMuch;
        this.push(data, 'utf8');
        if (this.cursor === this.data.length) this.push(null);
    }
}

class FakeWriteStream extends Writable {
    constructor(target, options = {}) {
        options.decodeStrings = true;
        super(options);
        this.target = target;
        this.target.content = '';
    }

    _write(chunk, encoding, complete) {
        if (chunk instanceof Buffer) {
            chunk = chunk.toString('utf8');
        }
        console.log('got chunk', chunk);
        this.target.content += chunk;
        complete(null);
    }
}

function createReadStream(file) {
    try {
        accessSync(file);
        const data = mockFiles[path.dirname(file)].find(target => target.basename === path.basename(file));
        return new FakeReadStream(data.contents);
    }
    catch(e) {

    }
}

function createWriteStream(target) {
    const dir = path.dirname(target);
    if (!mockFiles[dir]) {
        mockFiles[dir] = [];
    }

    const location = {
        basename: path.basename(target),
        content: ''
    };

    mockFiles[dir].push(location);

    return new FakeWriteStream(location);
}

fs.__setMockFiles = __setMockFiles;
fs.readdirSync = readdirSync;
fs.accessSync = accessSync;
fs.createReadStream = createReadStream;
fs.createWriteStream = createWriteStream;

module.exports = fs;
