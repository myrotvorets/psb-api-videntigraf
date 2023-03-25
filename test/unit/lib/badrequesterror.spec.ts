import { BadRequestError } from '../../../src/lib/badrequesterror.mjs';

describe('BadRequestError', () => {
    it('should be correct', () => {
        const expectedMessage = 'message';
        const error = new BadRequestError(expectedMessage);
        expect(error).toHaveProperty('message', expectedMessage);
        expect(error).toHaveProperty('name', BadRequestError.name);
    });
});
