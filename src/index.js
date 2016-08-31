#!/usr/bin/env node --harmony
import path from 'path';
import { Repository } from 'nodegit';
import program from 'commander';
import { Spinner } from 'cli-spinner';
import Config from 'lib/config';
import {configPath} from 'lib/config/paths';
import chalk from 'chalk';

program.version(require(path.normalize(`${__dirname}/../package.json`)).version);

Spinner.setDefaultSpinnerString(21);
const spinner = new Spinner('Loading...');
spinner.start();

async function tyche() {
    const config = Config.loadConfig(path.normalize(`${await configPath()}/./tyche.json`));

    //todo: Read repo state

    const vars = {
        command: null,
        tool: null,
        subcommand: null,
        dry: false,
        force: false
    };

    for (const command of config.topLevelTasks) {
        const name = command.name;
        const description = command.description || 'run task';
        const subCommands = command.resolve();

        const subCommandString = `${subCommands.filter(e => e !== command).map(e => e.name).join('|')}`;

        program.command(`${name} [${subCommandString}]`)
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

    spinner.stop();
    program.parse(process.argv);
    await vars.command.execute(vars.tool, vars.subcommand, vars.dry, config, vars.force);
};

async function main() {
    try {
        await tyche();
        console.log(chalk.bold.dim("May fortune find you!"));
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
};

main();
