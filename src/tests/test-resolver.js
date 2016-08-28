import {depResolve,Node} from 'lib/config/deps';
import assert from 'assert';

function testResolver() {
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
    assert.deepEqual(resolved.map(i => i.name), ['d', 'e', 'c', 'b', 'a']);
}

//todo: test for circular dependencies

testResolver();
