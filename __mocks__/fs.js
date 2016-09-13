import path from 'path';
const fs = jest.genMockFromModule('fs');
import {Readable, Writable} from 'stream';

let mockFiles = Object.create(null);
function __setMockFiles(newMockFiles) {
    mockFiles = Object.create(null);
    for (const file of Object.keys(newMockFiles)) {
        const pathToFile = file.split('/').join(path.sep);
        const dir = path.dirname(pathToFile);

        if (!mockFiles[dir]) {
            mockFiles[dir] = [];
        }
        mockFiles[dir].push({
            basename: path.basename(pathToFile),
            contents: newMockFiles[file],
            fail: false
        });
    }
}

function __failToRead(file) {
    file = convertFilePathToOs(file);
    mockFiles[path.dirname(file)].filter(target => target.basename === path.basename(file)).map(target => target.fail = true);
}

function readdirSync(directoryPath) {
    directoryPath = convertFilePathToOs(directoryPath);
    return mockFiles[directoryPath] || [];
}

function convertFilePathToOs(file) {
    return file.split('/').join(path.sep);
}

function symlink(source, dest, type, complete) {
    try {
        accessSync(source)
    }
    catch(err) {
        complete(new Error('failed to open source'));
        return;
    }

    const file = convertFilePathToOs(source);

    if(mockFiles[path.dirname(file)].filter(target => target.basename === path.basename(file))[0].fail) {
        complete(new Error('fail!!!'));
        return;
    }

    complete();
}

function accessSync(file) {
    file = convertFilePathToOs(file);
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
        this.data = data.contents;;
        this.fail = data.fail;
    }

    _read(size) {
        const howMuch = this.data.length - this.cursor >= size ? size : this.data.length - this.cursor;
        const data = this.data.slice(this.cursor, howMuch);
        this.cursor += howMuch;
        this.push(data, 'utf8');
        if (this.fail) this.emit('error', new Error('fake error on read stream'));
        else if (this.cursor === this.data.length) this.push(null);
    }
}

class FakeWriteStream extends Writable {
    constructor(target, options = {}) {
        options.decodeStrings = true;
        super(options);
        this.target = target;
        this.target.content = '';
        this.fail = target.fail;
    }

    _write(chunk, encoding, complete) {
        if (chunk instanceof Buffer) {
            chunk = chunk.toString('utf8');
        }
        console.log('got chunk', chunk);
        if (this.fail) complete(new Error('fake write stream error'));
        this.target.content += chunk;
        complete(null);
    }
}

function createReadStream(file) {
    file = convertFilePathToOs(file);
    accessSync(file);
    const data = mockFiles[path.dirname(file)].find(target => target.basename === path.basename(file));
    return new FakeReadStream(data);
}

function createWriteStream(target) {
    target = convertFilePathToOs(target);
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
fs.__failToRead = __failToRead;
fs.readdirSync = readdirSync;
fs.accessSync = accessSync;
fs.createReadStream = createReadStream;
fs.createWriteStream = createWriteStream;
fs.symlink = symlink;

module.exports = fs;
