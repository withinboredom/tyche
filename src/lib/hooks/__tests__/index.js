import HookManager from '../index';
import path from 'path';

jest.mock('fs');

describe('HookManager', () => {
    let fs;
    beforeEach(() => {
        fs = require('fs');
    });

    it('can be initialized without error', () => {
        expect(() => new HookManager('.')).not.toThrow();
    });

    it('can detect hooks already installed', () => {
        fs.__setMockFiles({
            '.git/hooks/pre-commit': '#!/usr/bin/env node --harmony'
        });
        const manager = new HookManager('.');
        expect(manager.hasHook('push')).toBe(false);
        expect(manager.hasHook('pre-commit')).toBe(true);
    });

    it('can discover if the installed hook belongs to tyche', async() => {
        fs.__setMockFiles({
            '.git/hooks/push': `#!/bin/bash`,
            '.git/hooks/pre-commit': `#!/usr/bin/env node --harmony
/* {"HOOK_VERSION": 1} */`,
            '.git/hooks/not-really': `#!/usr/bin/env node --harmony
/* some header
 * goes here
 */`
        });
        const manager = new HookManager('.');
        expect(await manager.isTycheHook('push')).toBe(false);
        expect(await manager.isTycheHook('pre-commit')).toBe(true);
        expect(await manager.isTycheHook('not-really')).toBe(false);
    });

    it('can install a hook', async() => {
        const files = {};

        const hookLocation = path.normalize(path.join(path.dirname(__dirname),'../../../','src/lib/hook.js'));
        files[hookLocation] = `#!/usr/bin/env node --harmony
/* {"HOOK_VERSION": 2} */`;
        fs.__setMockFiles(files);
        const manager = new HookManager('.');
        expect(await manager.install('push')).toBe(true);
    });

    it('can gracefully fail to install a hook', async() => {
        const files = {};

        const hookLocation = path.normalize(path.join(path.dirname(__dirname),'../../../','src/lib/hook.js'));
        files[hookLocation] = `#!/usr/bin/env node --harmony
/* {"HOOK_VERSION": 2} */`;
        fs.__setMockFiles(files);
        fs.__failToRead(hookLocation);
        const manager = new HookManager('.');
        expect(await manager.install('push')).toBe(false);
    });

    it('can update a hook', async () => {
        const files = {
            '.git/hooks/push': `#!/bin/bash`,
            '.git/hooks/pre-commit': `#!/usr/bin/env node --harmony
/* {"HOOK_VERSION": 1} */`,
            '.git/hooks/not-really': `#!/usr/bin/env node --harmony
/* some header
 * goes here
 */`
        };
        const hookLocation = path.normalize(path.join(path.dirname(__dirname),'../../../','src/lib/hook.js'));
        files[hookLocation] = `#!/usr/bin/env node --harmony
/* {"HOOK_VERSION": 2} */`;
        fs.__setMockFiles(files);
        const manager = new HookManager('.');
        expect(await manager.install('pre-commit')).toBe(true);
    });

    it('wont overwrite a hook that pre-existed', async () => {
        const files = {
            '.git/hooks/push': `#!/bin/bash`,
            '.git/hooks/pre-commit': `#!/usr/bin/env node --harmony
/* {"HOOK_VERSION": 1} */`,
            '.git/hooks/not-really': `#!/usr/bin/env node --harmony
/* some header
 * goes here
 */`
        };
        const hookLocation = path.normalize(path.join(path.dirname(__dirname),'../../../','src/lib/hook.js'));
        files[hookLocation] = `#!/usr/bin/env node --harmony
/* {"HOOK_VERSION": 2} */`;
        fs.__setMockFiles(files);
        const manager = new HookManager('.');
        expect(await manager.install('not-really')).toBe(true);
    });

    it('wont update a hook if it doesnt need updating', async () => {
        const files = {
            '.git/hooks/push': `#!/bin/bash`,
            '.git/hooks/pre-commit': `#!/usr/bin/env node --harmony
/* {"HOOK_VERSION": 2} */`,
            '.git/hooks/not-really': `#!/usr/bin/env node --harmony
/* some header
 * goes here
 */`
        };
        const hookLocation = path.normalize(path.join(path.dirname(__dirname),'../../../','src/lib/hook.js'));
        files[hookLocation] = `#!/usr/bin/env node --harmony
/* {"HOOK_VERSION": 2} */`;
        fs.__setMockFiles(files);
        const manager = new HookManager('.');
        expect(await manager.install('pre-commit')).toBe(false);
    });
});
