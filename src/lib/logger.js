import Log from 'cli-logger';

const logger = Log({
    src: true,
    level: Log.TRACE,
    console: false,
    prefix: function(record) {
        return `${new Date()} (${record.component || 'Main'}) [${this.names(record.level)}] <${record.src.file || ''}:${record.src.line || ''}>: `;
    }
});

export default logger;
