#!/usr/bin/env node --harmony
import path from 'path';
import program from 'commander';
import { Spinner } from 'cli-spinner';
import Config from 'lib/config';
import {dbFile, configPath} from 'lib/config/paths';
import TycheDb from 'lib/database';
import ToolMachine from 'lib/tool';

program.version(require(path.normalize(`${__dirname}/../package.json`)).version);

Spinner.setDefaultSpinnerString(21);
const spinner = new Spinner('Loading...');
spinner.start();

async function tyche() {
    const database = new TycheDb(dbFile);
    await database.initializeDb();
    const config = Config.loadConfig(path.normalize(`${configPath()}/./tyche.json`), database);

    //todo: Read repo state

    const vars = {
        command: null,
        tool: null,
        subcommand: null,
        dry: false,
        force: false
    };

    for (const command of config.tasks.tasks) {
        const name = command.name;
        const description = command.description || 'run task';
        const subCommands = command.children().join('|');

        program.command(`${name} [${subCommands}]`)
            .description(description)
            .option('-t --tool <tool>', 'use the default tool')
            .option('-d --dry', 'Show all the commands the tool is about to run')
            .option('-f --force', 'Run all tasks, even skipped ones')
            .action((subcommand, options) => {
                if (typeof subcommand === 'object') {
                    options = subcommand;
                    subcommand = null;
                }
                vars.command = command;
                vars.tool = options.tool;
                vars.subcommand = subcommand;
                vars.dry = options.dry;
                vars.force = options.force || false;
            });
    }

    program.command('init')
        .description('Initialize the tool in this repository')
        .action(() => {
            // broken
        });

    program.command('bump')
        .description('Bump the build number +1')
        .option('--set <number>', 'set the build number to a specific value')
        .action((options) => {
            // todo: increase the version number
        });

    spinner.stop();
    program.parse(process.argv);
    let doit = 'execute';
    if (vars.dry) {
        doit = 'dry';
    }

    let preferredToolString = config.defaultTool;
    if (vars.tool) {
        preferredToolString = vars.tool;
    }

    let command = vars.command;
    if (vars.subcommand) {
        command = command.tasks.find((e) => e.name === vars.subcommand);
    }

    console.log(await command[doit](ToolMachine(preferredToolString)));

    let exiting = false;
    process.on('beforeExit', () => !exiting ? exiting = true && database.finish() : null);
};

async function main() {
    try {
        await tyche();
        console.log("May fortune find you!");
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
};

main();
