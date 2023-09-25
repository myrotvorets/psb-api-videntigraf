import { expect } from 'chai';
import { FaceXError } from '@myrotvorets/facex';
import { errorResponseFromFaceXError } from '../../../src/lib/facexerror.mjs';

describe('errorResponseFromFaceXError', function () {
    it('should produce correct results', function () {
        const error = new FaceXError('message');
        const result = errorResponseFromFaceXError(error);
        expect(result).to.deep.equal({
            success: false,
            status: 502,
            code: 'FACEX_ERROR',
            message: error.message,
        });
    });
});
