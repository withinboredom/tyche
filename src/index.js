#!node --harmony
import path from 'path';
import program from 'commander';
import { Spinner } from 'cli-spinner';
import Config from 'lib/config';
import {dbFile, configPath} from 'lib/config/paths';
import TycheDb from 'lib/database';
import ToolMachine from 'lib/tool';
import Logger from 'lib/logger';
import semver from 'semver';

const Log = Logger.child({
    component: 'Main'
});

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

    program.option('-v, --verbose', 'Turn on verbose logging', () => {
        Logger.level(Logger.TRACE);
    });

    for (const command of config.tasks.tasks) {
        const name = command.name;
        if (name === 'bump') {
            continue; // bump is reserved
        }
        const description = command.description || 'run task';
        const subCommands = command.children().join('|');

        program.command(`${name} [${subCommands}]`)
            .description(description)
            .option('-t, --tool <tool>', 'use the default tool')
            .option('-d, --dry', 'Show all the commands the tool is about to run')
            .action((subcommand, options) => {
                if (typeof subcommand === 'object') {
                    options = subcommand;
                    subcommand = null;
                }

                while(process.argv[0].indexOf('tyche') < 0) {
                    process.argv.shift();
                }
                process.argv.shift(); // remove the tyche command
                process.argv.shift(); // remove the command
                if (subcommand) process.argv.shift(); // remove the subcommand

                vars.command = command;
                vars.tool = options.tool;
                vars.subcommand = subcommand;
                vars.dry = options.dry;
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
        .option('-i, --level [level]', 'if you are using semver, this is one of major, minor, patch, premajor, preminor, prepatch, or prerelease.  Default level is patch.')
        .option('-p, --preid <identifier>', 'if you are using semver, used to prefix premajor, preminor, prepatch or prerelease version increments.')
        .action(async (options) => {
            const prevVersion = database.buildNumber;
            let newVersion = prevVersion;
            if (semver.valid(prevVersion)) {
                const level = options.level || 'patch';
                const preid = options.preid || null;
                newVersion = semver.inc(prevVersion, level, preid);
                if (prevVersion[0] == 'v') {
                    newVersion = `v${newVersion}`;
                }
            }
            else if (Number.parseInt(newVersion)) {
                newVersion = prevVersion + 1;
            }
            else {
                Logger.error(`I don't know how to increment ${prevVersion} -- try calling with '--set' to bump the version`);
            }
            if (options.set) {
                newVersion = options.set;
            }
            if (options.level) {
                if (semver.valid(newVersion)) {
                    semver.inc()
                }
            }
            database.buildNumber = newVersion;
            console.log(`Version set ${prevVersion} --> ${newVersion}`);
            const bump_task = config.tasks.search('bump');
            if (bump_task) {
                // we have to reload the config (this is ugly)
                const config = Config.loadConfig(path.normalize(`${configPath()}/./tyche.json`), database);
                const bump_task = config.tasks.search('bump');
                await bump_task.execute(ToolMachine(config.defaultTool));
            }
        });

    spinner.stop();
    program.parse(process.argv);

    if (vars.command) {
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

        command.reduce();

        //todo: A proper output
        console.log(await command[doit](ToolMachine(preferredToolString)));
    }

    // I've seen this event fire more than once, so we only really care about the first time.
    // This also prevents us from saving the database state if the process exits unexpectedly
    let exiting = false;
    process.on('beforeExit', () => exiting ? null : exiting = true && database.finish());
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
