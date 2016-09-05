module.exports = {
    Repository: {
        open: jest.fn(async () => {
            return {
                path: jest.fn(),
                getHeadCommit: jest.fn(async () => ({
                    id: jest.fn(() => ({
                        tostrS: jest.fn(() => '12345')
                    }))
                }))
            };
        })
    }
};
