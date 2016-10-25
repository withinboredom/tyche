/**
 * @module lib/parser/task
 */

class Task {
    /**
     * Createa a scope for a task
     * @param {Task} parent
     */
    constructor(parent) {
        this.vars = Object.create(parent ? parent.vars : null);
        this.parent = parent;
    }

    /**
     * Creates an inner scope
     * @returns {Task}
     */
    inner() {
        return new Task(this);
    }

    /**
     * Lookup the scope of a name
     * @param {string} name
     * @returns {Task}
     */
    lookup(name) {
        let scope = this;
        while(scope) {
            if ({}.hasOwnProperty.call(scope.vars, name)) {
                return scope;
            }
            scope = scope.parent;
        }
    }

    /**
     * Get the value of a name
     * @param {string} name
     * @returns {*}
     */
    getValue(name) {
        if (name in this.vars) {
            return this.vars[name];
        }
        throw new Error(`Unable to get value for ${name}`);
    }

    /**
     * Set the value of a name
     * @param {string} name
     * @param {*} value
     * @returns {*}
     */
    setValue(name, value) {
        const scope = this.lookup(name);
        if (!scope && this.parent) {
            throw new Error(`${name} undefined!!`);
        }
        return (scope || this).vars[name] = value;
    }

    /**
     * Define a var
     * @param {string} name
     * @param {*} value
     * @returns {*}
     */
    defineVar(name, value) {
        return this.vars[name] = value;
    }
}

/**
 *
 * @param {object} exp
 * @param {Task} env
 * @returns {*}
 */
function EvaluateAST(exp, env) {
    switch(exp.type) {
        case 'DefaultTool':
        case 'description':
            env.defineVar(exp.type, exp.value);
            break;
        case 'task':
            const inner = env.inner();
            env.defineVar(exp.value, inner);
            exp.body.map((exp) => {
                EvaluateAST(exp, inner);
            });
            break;
        case 'exec':
            env.exec = env.exec || {};
            env.exec[exp.value] = exp.body.map((exp) => EvaluateAST(exp, env)).slice(-1)[0];
            break;
        case 'command':
            return () => exp.value;
        case 'ref':
            return env.defineVar(`ref-${exp.value}`, () => env.getValue(exp.value));
        case 'and':
        case 'or':
            switch(exp.action) {
                case 'skip':
                    if (env.lookup('skips') != null) {
                        // todo: handle case where we should skip because parent skips
                    }
                    else {
                        env.defineVar('skips', []);
                        env.getValue('skips').push((executor) => exp.body.map((obj) => executor(obj, exp.what, exp.negative)));
                    }
                    break;
                default:
                    throw new Error(`Unable to use ${exp.action} as and/or`);
            }
            break;
        default:
            console.log(exp);
            let scope = env;
            while (scope) {
                if (!scope.parent) {
                    break;
                }
                console.log('ME:', scope);
                scope = scope.parent;
            }
            throw new Error(`Unable to evaluate ${exp.type}`);
    }
}

export default Task;
export {EvaluateAST};
