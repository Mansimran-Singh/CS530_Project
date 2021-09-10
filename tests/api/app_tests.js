const assert = require('assert');
const should = require('chai').should();

// including the system under test causes chai to hang at the end
// I'm assuming there is some async function that isn't exiting but I need time to figure out where
// const sut = require('./../api/app.js');

describe('app_tests.js', () => {
    describe('/GET', () => {
        it('returns successfully', () => {
            should.fail();
        });
    });
    
});
