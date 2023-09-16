import { describe, it } from 'mocha';
import { expect } from 'chai';
import { BadRequestError } from '../../../src/lib/badrequesterror.mjs';

describe('BadRequestError', () => {
    it('should be correct', () => {
        const expectedMessage = 'message';
        const error = new BadRequestError(expectedMessage);
        expect(error).to.be.instanceOf(BadRequestError).and.include({
            message: expectedMessage,
            name: BadRequestError.name,
        });
    });
});
