import crypto from 'crypto';
import fs from 'fs';

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
                console.log(resolved);
                throw Error(`Circular dependencies detected: ${edge.name} and ${node.name}`);
            }
            depResolve(edge, resolved, unresolved);
        }
    }
    resolved.push(node);
    unresolved.splice(unresolved.findIndex(n => n === node), 1);
}

/**
 * Belongs in a unit test
 let a = new Node('a');
let b = new Node('b');
let c = new Node('c');
let d = new Node('d');
let e = new Node('e');

a.addEdge(b);
a.addEdge(d);
b.addEdge(c);
b.addEdge(e);
c.addEdge(d);
c.addEdge(e);
//d.addEdge(b);

let resolved = [];
depResolve(a, resolved);
console.log(resolved);*/

/**
 * Handles app configuration
 */
export default class Config {
    /**
     * Create a new config object
     * @param {Object} config The raw configuration object
     */
    constructor(config) {
        this.raw = config;
        this.projectNodes = new Map();
    }

    /**
     * Loads a configuration file and returns a config object
     * @param {string} file The file to load
     * @returns {Config|undefined} The configuration object
     */
    static loadConfig(file) {
        try {
            const raw = require(file);
            return new Config(raw);
        } catch(e) {
            console.error(`Unable to load config file: ${file}`);
            console.log(e);
            process.exit(1);
        }

        return undefined;
    }

    /**
     * Returns an array of project names in the order they can be built in
     * @returns {Array} The array of projects
     */
    getProjectsInOrder() {
        for (const project of this.raw.projects) {
            if (!this.projectNodes.has(project)) {
                this.projectNodes.set(project.name, new Node(project.name));
            }

            if (project.final) {
                this.projectNodes.set('root', this.projectNodes.get(project.name));
            }

            if (Array.isArray(project.dependencies)) {
                for (const dep of project.dependencies) {
                    if (!this.projectNodes.has(dep)) {
                        this.projectNodes.set(dep, new Node(dep));
                    }

                    this.projectNodes.get(project.name).addEdge(this.projectNodes.get(dep));
                }
            }
        }

        if (!this.projectNodes.has('root')) {
            throw new Error("No project specified as final=true");
        }

        const resolved = [];
        const unresolved = [];

        depResolve(this.projectNodes.get('root'), resolved, unresolved);

        if (unresolved.length > 0) {
            throw new Error(`No dependency set for ${unresolved[0].name}`);
        }

        return resolved.map(n => n.name);
    }

    /**
     * Get's a list of files that require validation
     * @returns {Array} The list of files that require validation
     */
    getValidationFiles() {
        const list = [];
        for(const project of this.raw.projects) {
            if (project.invalidate && project.invalidate.length > 0) {
                for(const type of project.invalidate) {
                    if (type.files && type.files.length > 0) {
                        for(const file of type.files) {
                            list.push(file);
                        }
                    }
                }
            }
        }
        return list;
    }

    getListOfValidationHashes() {
        const files = this.getValidationFiles();
        const list = [];

        for(const file of files) {
            const hash = crypto.createHash('sha256');
            const input = fs.createReadStream(file);

            input.on('data', (data) => {
                hash.update(data);
            });

            list.push(new Promise((done) => {
                input.on('end', () => {
                    const digest = hash.digest('hex');
                    done({
                        digest,
                        file
                    });
                });
            }));
        }

        return Promise.all(list);
    }
}