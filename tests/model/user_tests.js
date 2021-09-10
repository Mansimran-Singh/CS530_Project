const assert = require('assert');
const should = require('chai').should();

const { User } = require('../../model/user');

describe('user_tests.js', () => {
    
    it('should inititalize', () => {
        let u = new User('Bob');
        u.getName().should.be.a('string');
        u.getName().should.equal('Bob');
    });
    
    
});
