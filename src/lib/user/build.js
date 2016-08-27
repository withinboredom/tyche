/**
 * Builds projects
 * @param {Config} config The configuration object
 * @param {string} project The project to build
 * @param {boolean} native Whether or not we want to use tools to build
 */
export default function(config, project = '', native = true) {
    const buildOrder = config.getProjectsInOrder();
    const finishedAt = (project === '' ? buildOrder.length : buildOrder.findIndex(t => t === project));

    if (finishedAt === undefined) {
        throw new Error(`Cannot find ${project} to build`);
    }
}
