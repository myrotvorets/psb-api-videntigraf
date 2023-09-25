import { expect } from 'chai';
import { UploadError } from '../../../src/lib/uploaderror.mjs';

describe('UploadError', function () {
    it('should be correct', function () {
        const expectedMessage = 'message';
        const expectedFile = 'file';
        const error = new UploadError(expectedMessage, expectedFile);
        expect(error).to.be.instanceOf(UploadError).and.include({
            message: expectedMessage,
            file: expectedFile,
            name: UploadError.name,
        });
    });
});
