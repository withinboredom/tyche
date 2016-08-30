#!/usr/bin/env node
import path from 'path';
import { Repository } from 'nodegit';
import program from 'commander';
import { Spinner } from 'cli-spinner';
import Config from 'lib/config';
import database from 'lib/config/db';
import {configPath} from 'lib/config/paths';

program.version(require(path.normalize(`${__dirname}/../package.json`)).version);

Spinner.setDefaultSpinnerString(21);
const spinner = new Spinner('Loading...');
spinner.start();

async function tyche() {
    const db = (await database());

    const config = Config.loadConfig(path.normalize(`${await configPath()}/./tyche.json`));

    //todo: Read repo state

    for (const command of config.topLevelTasks) {
        const name = command.name;
        const description = command.description || 'run task';
        const subCommands = command.resolve();

        const subCommandString = `${subCommands.filter(e => e !== command).map(e => e.name).join('|')}`;

        program.command(`${name} [${subCommandString}]`)
            .description(description)
            .option('-t --tool <tool>', 'use the default tool')
            .option('-d --dry', 'Show all the commands the tool is about to run')
            .action((subcommand, ...options) => {
                command.execute(options[0].tool, subcommand, options[0].dry, config);
                db.saveDatabase();
            });
    }

    async function test() {
        const repo = await Repository.open(process.cwd());
        const path = repo.path();
        console.log(path);
    }

    program.command('init')
        .description('Initialize the tool in this repository')
        .action(() => {
            test();
        });

    spinner.stop();
    program.parse(process.argv);
};

async function main() {
    try {
        await tyche();
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
};

main();
