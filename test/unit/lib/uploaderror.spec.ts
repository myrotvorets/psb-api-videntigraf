import { UploadError } from '../../../src/lib/uploaderror.mjs';

describe('UploadError', () => {
    it('should be correct', () => {
        const expectedMessage = 'message';
        const expectedFile = 'file';
        const error = new UploadError(expectedMessage, expectedFile);
        expect(error).toHaveProperty('message', expectedMessage);
        expect(error).toHaveProperty('file', expectedFile);
        expect(error).toHaveProperty('name', UploadError.name);
    });
});
