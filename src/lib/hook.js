#!/usr/bin/env node --harmony
/* {"HOOK_VERSION": 1} */

import path from 'path';
import fs from 'fs';
import TycheDb from 'lib/database';
import Config from 'lib/config';
import {dbFile, configPath} from 'lib/config/paths';
import ToolMachine from 'lib/tool';

async function getAppDb(dbFile) {
    const database = new TycheDb(dbFile);
    await database.initializeDb();
    return database;
}

function getConfig(database) {
    return Config.loadConfig(path.normalize(`${configPath()}/./tyche.json`), database);
}

async function runStudies() {
    const database = await getAppDb(dbFile);
    const config = getConfig(database);
    let exiting = false;
    process.on('beforeExit', () => exiting ? null : exiting = true && database.finish());

    const hook = process.argv[1].split(path.sep).slice(-1).pop();
    await runOtherHook(hook);
    const study = config.student.triggers.filter(t => hook.endsWith(t.on));
    const result = await config.student.scan(study);
    study.map(grade => {
        if(result.changes > 0) {
            if (grade.message.warn) {
                console.log('WARNING:', grade.message.warn);
            }
            if (grade.message.error) {
                console.error('ERROR:', grade.message.error);
                process.exitCode = 1;
            }
        }
    })
}

async function runOtherHook(hook) {
    try {
        fs.accessSync(`.git/hooks/${hook}-orig`);
        const task = {
            name: 'run-hook',
            exec: {
                native: {
                    command: [`.git/hooks/${hook}-orig`,...process.argv.slice(2)]
                }
            }
        };

        const Tool = new (ToolMachine('native'));
        Tool.buildFromStep(task);
        process.exitCode = await Tool.execTool();
    }
    catch(err) {
        // yeah, couldn't find anything so lets continue
    }
}

runStudies();
