class UnresolvedTask {
    constructor(name, parent) {
        this.name = name;
        this.parent = parent;
    }

    fix(realSelf) {
        //replace myself out of the tree
        this.parent.tasks[this.parent.tasks.findIndex(task => task.name === this.name)] = realSelf;
    }
}

export default UnresolvedTask;
