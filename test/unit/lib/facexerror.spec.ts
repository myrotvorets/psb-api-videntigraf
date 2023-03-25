import { FaceXError } from '@myrotvorets/facex';
import { errorResponseFromFaceXError } from '../../../src/lib/facexerror.mjs';

describe('errorResponseFromFaceXError', () => {
    it('should produce correct results', () => {
        const error = new FaceXError('message');
        const result = errorResponseFromFaceXError(error);
        expect(result).toEqual({
            success: false,
            status: 502,
            code: 'FACEX_ERROR',
            message: error.message,
        });
    });
});
