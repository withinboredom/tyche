#!/usr/bin/env node --harmony

import input from 'lib/parser/inputStream';
import tokens from 'lib/parser/tokenStream';
import util from 'util';
import parser from 'lib/parser/parser';
import fs from 'fs';

const file = fs.readFileSync('./tyche.tasks', {encoding: 'utf8'});

console.log(file);

let inp = new input(file);
let toks = new tokens(inp);
while(!toks.eof()) {
    console.log(toks.next());
}

inp = new input(file);
toks = new tokens(inp);
console.log("\n**********\n");
const ast = new parser(toks);
const parsed = ast.parse();
console.log(util.inspect(parsed, false, null));

