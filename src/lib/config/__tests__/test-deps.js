jest.disableAutomock();

import {depResolve,Node} from '../deps';

describe('deps can be resolved', () => {
    it('can resolve dependencies', () => {
        const a = new Node('a');
        const b = new Node('b');
        const c = new Node('c');
        const d = new Node('d');
        const e = new Node('e');
        const f = new Node('f');

        a.addEdge(b);
        a.addEdge(d);
        b.addEdge(c);
        b.addEdge(e);
        c.addEdge(d);
        c.addEdge(e);
        f.addEdge(a); // ensure later deps don't get built
        f.addEdge(c); // ensure sibling deps don't get built

        const resolved = [];
        depResolve(a, resolved);
        expect(resolved.map(i => i.name)).toEqual(['d','e','c','b','a']);
    });
    it('cannot handle circular dependencies', () => {
        const a = new Node('a');
        const b = new Node('b');
        const c = new Node('c');
        const d = new Node('d');
        const e = new Node('e');

        a.addEdge(b);
        a.addEdge(d);
        b.addEdge(c);
        b.addEdge(e);
        c.addEdge(d);
        c.addEdge(e);
        c.addEdge(a); // create circular dep

        const resolved = [];
        try {
            depResolve(a, resolved);
        } catch(err) {
            expect(err).toBeDefined();
        }
    })
});
