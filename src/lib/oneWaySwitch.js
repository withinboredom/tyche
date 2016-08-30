class oneWaySwitch {
    constructor() {
        this.active = false;
    }

    set isActive(active) {
        if (active) {
            this.active = true;
        }
    }

    get isActive() {
        return this.active;
    }
}

export default oneWaySwitch;
