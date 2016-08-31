/**
 * A simple node for dependency walking
 */
class Node {
    /**
     * Create a simple Node
     * @param {string} name The name of the Node
     */
    constructor(name) {
        this.name = name;
        this.edges = [];
    }

    /**
     * Adds an edge to this Node
     * @param {Node} node The node to add an edge to
     */
    addEdge(node) {
        this.edges.push(node);
    }
}

/**
 * Walk from a node
 * @param {Node} node The node to start from
 * @param {Array} resolved a list of all resolved dependencies
 * @param {Array} unresolved a list of all unresolved dependencies
 */
function depResolve(node, resolved = [], unresolved = []) {
    unresolved.push(node);
    for (const edge of node.edges) {
        if (resolved.find(n => n === edge) === undefined) {
            if (unresolved.find(n => n === edge) !== undefined) {
                throw Error(`Circular dependencies detected: ${edge.name} and ${node.name}`);
            }
            depResolve(edge, resolved, unresolved);
        }
    }
    resolved.push(node);
    unresolved.splice(unresolved.findIndex(n => n === node), 1);
}

export { depResolve, Node };
