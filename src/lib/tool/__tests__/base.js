import Base from 'lib/tool/base';

describe('test the base tool', () => {
    const tool = new Base();
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
        expect(tool.nativeCommand).toBe('echo hello world');
    });

    it('can set env vars', () => {
        tool.meta = {test: true}
        expect(() => tool.nativeCommand = ['hello','world']).not.toThrow();
        expect(tool.nativeCommand).toBe('echo hello world');
        expect(tool.getDryRun()).toBe('test=true echo hello world');
    });

    it('can fail', async () => {
        tool.command = false;
        const result = await tool.execTool();
        expect(result).toBe(1);
    });

    it('can fail hard', async () => {
        tool.command = 'adgflaehfkjahfkj';
        const result = await tool.execTool();
        expect(result).toBe(127);
    });
});
