const fuzmoiseach = require('../fuzmoisearch');

describe("FuzMoiSearch", function() {

    it("Should return empty array by default", function() {
        expect(fuzmoiseach()).toEqual([]);
    });

    it("Should return result when matching a string in array of string", function() {
        var list = ['bonjour', 'bonsoir'],
            search = 'bonjou';
        expect(fuzmoiseach(list, search)).toEqual(['bonjour']);
    });
});
