import { expect } from 'chai';
import { BadRequestError } from '../../../src/lib/badrequesterror.mjs';

describe('BadRequestError', function () {
    it('should be correct', function () {
        const expectedMessage = 'message';
        const error = new BadRequestError(expectedMessage);
        expect(error).to.be.instanceOf(BadRequestError).and.include({
            message: expectedMessage,
            name: BadRequestError.name,
        });
    });
});
