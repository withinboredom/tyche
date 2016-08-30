/**
 * Returns a new tool
 * @param {string} toolString The tool to create
 * @returns {Tool} A tool
 */
export default function(toolString) {
    const tool = require(`./${toolString}`).default;
    return tool;
}
