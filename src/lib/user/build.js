import { Spinner } from 'cli-spinner';
/**
 * Builds projects
 * @param {Config} config The configuration object
 * @param {string} project The project to build
 * @param {string} buildTool The tool to use to build
 * @param {boolean} native Whether or not we want to use tools to build
 */
function builder(config, project = '', buildTool) {
    let tool;
    const spinner = new Spinner('calculating dependencies...');
    spinner.start();
    console.log('calculating');
    const buildOrder = config.getProjectsInOrder();
    console.log('got build order', buildOrder);
    const finishedAt = (project === '' ? buildOrder.length : buildOrder.findIndex(t => t === project));


    console.log('stopping at', finishedAt);

    if (finishedAt === -1) {
        spinner.stop(true);
        console.log(`Cannot find ${project} to build`);
        throw new Error(`Cannot find ${project} to build`);
    }

    buildTool = buildTool || config.raw.settings.defaultTool || 'native';

    switch(buildTool) {
        case 'native':
        default:
            tool = require('lib/tool/native').default;
            break;
        case 'docker-compose':
            tool = require('lib/tool/docker-compose').default;
            break;
    }

    buildOrder.reduce((prev, projectName, index) => {
        return prev.then(() => {
            if (index >= finishedAt) {
                return Promise.resolve();
            }

            console.log('starting', projectName);

            const exec = new tool();
            const project = config.raw.projects.find(p => p.name === projectName);
            console.log(`#${index}: Building ${project.name} with the ${exec.toolName} tool`);
            spinner.setSpinnerTitle(`step #${index + 1}: Building ${project.name} with the ${exec.toolName} tool`);

            const step = project.build.find(p => p.tool === exec.toolName);

            //exec.nativeCommand = project.build.native;
            exec.buildFromStep(step);
            spinner.stop(true);
            const exit = exec.execTool();
            exit.then(() => {
                if (exit.code !== 0) {
                    throw new Error('Failure, see log output for details');
                }
            }, err => {
                console.error("er:", err);
                process.exit(1);
            });
            return exit;
        }, err => {
            console.error('uuh', err);
            process.exit(1);
        });
    }, Promise.resolve());
}

export default builder;
