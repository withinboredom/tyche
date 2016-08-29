#!/usr/bin/env node
import path from 'path';
import { Repository } from 'nodegit';
import program from 'commander';
import { Builder } from 'lib/user';
import { Spinner } from 'cli-spinner';
import Config from 'lib/config';
import loki from 'lokijs';
import fs from 'fs';
import os from 'os';

program.version('0.0.1');

Spinner.setDefaultSpinnerString(21);
const spinner = new Spinner('Loading...');
spinner.start();

const dbFile = path.normalize(`${os.homedir()}/.tyche.json`);

if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, '');
}

const db = new loki(dbFile);
const state = {};

const tyche = async () => {
    await new Promise((done) => {
        db.loadDatabase({}, () => {
            done();
        });
    });

    const repo = await Repository.open(process.cwd());
    const configPath = path.normalize(`${repo.path()}/../`);
    const config = Config.loadConfig(path.normalize(`${configPath}/./tyche.json`));
    const repoName = path.basename(configPath);

    const hashes = await config.getListOfValidationHashes();

    console.log(config.topLevelTasks);
    console.log(repoName);
    console.log(hashes);

    for(const command of config.topLevelTasks) {
        const name = command.name;
        const description = command.description || 'run task';

        program.command(`${name} [subtask]`)
            .description(description)
            .option('-t --tool <tool>', 'use the default tool')
            .option('-d --dry', 'Show all the commands the tool is about to run')
            .action((subtask, ...options) => {
                command.execute();
            });
    }

    program.command('init')
        .description('Initialize the tool in this repository')
        .action(stuff => {
            console.log('wooo');
        });

    spinner.stop();
    program.parse(process.argv);
};

tyche();

/*

new Promise((done) => {
    db.loadDatabase({}, () => {
        done();
    });
}).then(() => {
    return Repository.open(process.cwd());
}).then(repo => {
    state.configPath = path.normalize(`${repo.path()}/../`);
    state.config = Config.loadConfig(path.normalize(`${state.configPath}/./tyche.json`));
    state.repoName = path.basename(state.configPath);

    const repos = db.getCollection('repo') || db.addCollection('repo');
    const repoDb = repos.find({name: {'$eq': state.repoName}});

    // if this is the first instantiation, ever...
    if (repoDb.length === 0) {
        repos.insert([
            {
                name: state.repoName,
                lastConfig: state.config.raw,
                hooksInstalled: false,
                vHashes: [],
                dirtyFiles: [],
                buildNumber: 0
            }
        ]);

        console.log("This looks like this is the first time you've run tyche here. You should run `tyche init` to initialize the repo");
        throw new Error('no db');
    }

//todo: read repo state
    return state.config.getListOfValidationHashes();
}).then(hashes => {
    console.log(hashes);
    const repos = db.getCollection('repo');
    const repoDb = repos.find({name: state.repoName});
    if (JSON.stringify(hashes) !== JSON.stringify(repoDb.vHashes)) {
        //todo: we have dirty files, so we should flag them as such
        console.log('dirty files detected')
    }

//todo: ensure dev requirements are met
//todo: ensure dev constraints are met

    program.command('init').description('initialize the current repo').action(() => {
        //todo: install git hooks!
    });

    program.command('build [project]')
    .option('-t --tool <tool>', 'Set the default tool')
    .description('runs a given project').action((...options) => {
        console.log(options[1].tool);
        Builder(state.config, options[0], options[1].tool);
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
}).then(() => {
    console.log('May fortune find you!');
}, err => {
    console.log(err);
    return 1;
}).then((exit = 0) => {
    db.saveDatabase(() => {
        process.exit(exit);
    });
});
*/
