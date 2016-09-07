/**
 * @module lib/tool
 */

/**
 * Returns a new tool
 * @param {string} toolString The tool to create
 * @returns {Tool} A tool
 */
function ToolMachine(toolString) {
    const tool = require(`./${toolString}`).default;
    return tool;
}

export default ToolMachine;
