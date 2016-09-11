import Base from 'lib/tool/base';

describe('test the base tool', () => {
    let tool = new Base();

    beforeEach(() => {
        tool = new Base();
    });

    it('forces inherited classes to define a name', () => {
        expect(() => tool.toolName).toThrow();
    });

    it('can return a native command', () => {
        tool.native = ['hello','world'];
        tool.command = 'echo';
        expect(tool.nativeCommand).toBe('echo hello world');
    });

    it('can show me a dry run', () => {
        tool.native = ['hello','world'];
        tool.command = 'echo';
        expect(tool.getDryRun()).toBe('echo hello world');
    });

    it('does not know how to do anything', () => {
        expect(Base.knows).toEqual([]);
    });

    it('can set the native command', () => {
        expect(() => tool.nativeCommand = ['hello','world']).not.toThrow();
        expect(tool.nativeCommand).toBe(' hello world');
    });

    it('can set env vars', () => {
        tool.meta = {test: true};
        expect(() => tool.nativeCommand = ['hello','world']).not.toThrow();
        expect(tool.nativeCommand).toBe(' hello world');
        expect(tool.getDryRun()).toBe('test=true  hello world');
    });

    it('can fail', async () => {
        tool.command = false;
        expect(() => tool.nativeCommand = ['hello','world']).not.toThrow();
        const result = await tool.execTool();
        expect(result).toBe(1);
    });

    it('can fail hard', async () => {
        tool.command = 'adgflaehfkjahfkj';
        expect(() => tool.nativeCommand = ['hello','world']).not.toThrow();
        const result = await tool.execTool();
        expect(result).not.toBe(0);
    });

    it('will fail if a tool tries to run a command without being initialized', async () => {
        expect(tool.initialized).toBe(false);
        let passed = false;
        try {
            await tool.execTool();
        }
        catch (e) {
            expect(e).toBeDefined();
            passed = true;
        }
        finally {
            expect(passed).toBe(true);
        }
    })
});
