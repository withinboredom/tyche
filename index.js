#!/usr/bin/env node

var program = require('commander');

program
    .version('0.0.1');

//todo: read the configuration file
//todo: read repo state

program.command('init').description('initialize the current repo').action(() => {
    //todo: install git hooks!
});

program.command('build [project]').description('runs a given project').action((project) => {
    //todo: build a project
    console.log(project);
});

program.command('exec <project> <command...>').description('run a command in the context of a project').action((project, command) => {
    //todo: exec in a project
    console.log(project, command);
});

program.command('start [project]').description('start running a project').action((project) => {
    console.log(project);
});

program.command('do <action> [parameters...]').description('perform an action').action((action, parameters) => {
    console.log(action, parameters);
});

program.command('status').description('get the current status').action(() => {
    //todo: calculate the current status
});

program.command('test [project]').description('only run the unit tests for a specific project').action((project) => {
    console.log(project);
});

program.command('release <version> <target>').alias('deploy').description('release a version into the wild').action((version, target) => {
    console.log(version);
    console.log(target);
});

program.parse(process.argv);
