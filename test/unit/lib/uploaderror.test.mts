import { describe, it } from 'mocha';
import { expect } from 'chai';
import { UploadError } from '../../../src/lib/uploaderror.mjs';

describe('UploadError', () => {
    it('should be correct', () => {
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
