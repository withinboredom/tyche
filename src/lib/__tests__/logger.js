import Logger from 'lib/logger';

describe('the logger', () => {
    it('can create a child', () => {
        const Log = Logger.child({
            component: 'test'
        });
    });

    it('can set the levels on the parent, and it change the levels of the child', () => {
        const Log = Logger.child({
            component: 'test'
        });

        const originalLevel = Logger.level();
        expect(originalLevel).toBe(Logger.TRACE);

        const childOriginal = Log.level();
        expect(childOriginal).toBe(Logger.TRACE);

        Logger.level(Logger.INFO);
        const finalLevel = Logger.level();
        expect(finalLevel).toBe(Logger.INFO);

        const finalChild = Log.level();
        expect(finalChild).toBe(Logger.INFO);
    })
})
