/**
 * @module lib/bus
 */

import EventEmitter from 'events';
import Logger from 'lib/logger';

const Log = Logger.child({
    component: 'EventBus'
});

/**
 * This class intentionally left blank
 */
class Bus extends EventEmitter {
    on(...args) {
        Log.debug('Attaching event handler:', args[0]);
        super.on(...args);
    }
    emit(...args) {
        Log.debug('Emitting event:', args[0]);
        super.emit(...args);
    }
}

const bus = new Bus();

export default bus;
