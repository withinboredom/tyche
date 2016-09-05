const collections = {};

const getCollection = jest.fn((name) => {
    const collection = Object.keys(collections).filter(o => o === name);
    if (collection.length > 0) {
        return collections[collection];
    }

    collections[name] = {
        data: [],
        by: jest.fn((key, value) => {
            return collections[name].data.filter(e => e[key] == value)[0];
        }),
        insert: jest.fn((row) => {
            collections[name].data.push(row)
        })
    };
    return collections[name];
});

export default jest.fn(() => ({
    loadDatabase: jest.fn((db, cb) => {
        cb();
    }),
    getCollection: getCollection,
    addCollection: getCollection
}));
