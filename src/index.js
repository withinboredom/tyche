#!/usr/bin/env node
import path from 'path';
import { Repository } from 'nodegit';
import program from 'commander';
import { Builder } from 'lib/user';
import { Spinner } from 'cli-spinner';
import Config from 'lib/config';

program.version('0.0.1');

Spinner.setDefaultSpinnerString(21);
const spinner = new Spinner('Loading...');
spinner.start();
Repository.open(process.cwd()).then(repo => {
    const configPath = path.normalize(`${repo.path()}/../`);
    const config = Config.loadConfig(path.normalize(`${configPath}/./tyche.json`));

//todo: read repo state
//todo: ensure dev requirements are met
//todo: ensure dev constraints are met

    program.command('init').description('initialize the current repo').action(() => {
        //todo: install git hooks!
    });

    program.command('build [project]')
    .option('-t --tool <tool>', 'Set the default tool')
    .description('runs a given project').action((...options) => {
        console.log(options[1].tool);
        Builder(config, options[0], options[1].tool);
    });

    program.command('exec <project> <command...>').description('run a command in the context of a project').action((project, command) => {
        //todo: exec in a project
        console.log(project, command);
    });

    program.command('start [project]').description('start running a project').action(project => {
        console.log(project);
    });

    program.command('do <action> [parameters...]').description('perform an action').action((action, parameters) => {
        console.log(action, parameters);
    });

    program.command('status').description('get the current status').action(() => {
        //todo: calculate the current status
    });

    program.command('test [project]').description('only run the unit tests for a specific project').action(project => {
        console.log(project);
    });

    program.command('release <version> <target>').alias('deploy').description('release a version into the wild').action((version, target) => {
        console.log(version);
        console.log(target);
    });

    spinner.stop();
    program.parse(process.argv);
});
