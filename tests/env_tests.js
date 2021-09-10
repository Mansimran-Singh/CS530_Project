const assert = require('assert');
const should = require('chai').should();
const sut = require('./../env.js');

describe('env_tests.js', () => {
    describe('mongoDbPassword', () => {
        it('should exist', () => { should.exist(sut.mongoDbPassword); });
        it('should have length >0', () => { sut.mongoDbPassword.length.should.be.greaterThan(0); });
    });
    

    it('database name should be cs530', () => {
        should.exist(sut.databaseName);
        sut.databaseName.length.should.be.greaterThan(0);
        sut.databaseName.should.equal('cs530');
    });
    
    it('mongoDbConnectionString should exist', () => {
        should.exist(sut.mongoDbConnectionString);
        sut.mongoDbConnectionString.length.should.be.greaterThan(0);
    });
});
