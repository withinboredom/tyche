import Log from 'cli-logger';

const logger = Log({
    src: true,
    level: process.env.NODE_ENV == 'test' ? Log.TRACE : Log.WARN,
    console: false,
    prefix: function(record) {
        return `${new Date()} (${record.component || 'Main'}) [${this.names(record.level)}] <${record.src.file || ''}:${record.src.line || ''}>: `;
    }
});

logger.originalChild = logger.child;
logger.originalLevel = logger.level;

const children = [];

logger.child = function(...args) {
    const ret = this.originalChild(...args);
    //const ret = logger.prototype.level.call(this, args[0]);
    children.push(ret);
    return ret;
};

logger.level = function(...args) {
    const ret = this.originalLevel(...args);
    for(const kid of children) {
        kid.level(...args);
    }
    return ret;
};

export default logger;
