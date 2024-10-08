import { expect } from 'chai';
import { FaceXError, VideoResult, type VideoStatus, type VideoUploadAck, responseFactory } from '@myrotvorets/facex';
import { type ProcessingStats, VideoService } from '../../../src/services/videoservice.mjs';
import { UploadError } from '../../../src/lib/uploaderror.mjs';
import { BadRequestError } from '../../../src/lib/badrequesterror.mjs';
import { FakeFaceXVideoClient, getVideoResultMock, getVideoStatusMock, uploadVideoMock } from './fakeclient.mjs';
import {
    clientGUID,
    emptyVideoResult,
    failedStatusResponse,
    failedVideoResult,
    failedVideoUploadResponse,
    fakeFile,
    inProgressStatusResponse,
    successfulStatusResponse,
    successfulVideoResult,
    successfulVideoUploadResponse,
} from './fixtures.mjs';

describe('VideoService', function () {
    let service: VideoService;

    before(function () {
        service = new VideoService(new FakeFaceXVideoClient('https://example.com', 'client_id'));
    });

    describe('#upload()', function () {
        it('should fail on error', function () {
            const response = responseFactory(failedVideoUploadResponse) as VideoUploadAck;
            uploadVideoMock.mock.mockImplementationOnce(() => Promise.resolve(response));
            return expect(service.upload(fakeFile)).to.be.rejectedWith(UploadError);
        });

        it('should return GUID on success', function () {
            const expectedGUID = '00000000-0000-0000-0000-000000000001';
            const response = responseFactory(successfulVideoUploadResponse(expectedGUID)) as VideoUploadAck;
            uploadVideoMock.mock.mockImplementationOnce(() => Promise.resolve(response));
            return expect(service.upload(fakeFile)).to.become(expectedGUID);
        });
    });

    describe('#getVideoStatus()', function () {
        it('should fail on error', function () {
            const response = responseFactory(failedStatusResponse) as VideoStatus;
            getVideoStatusMock.mock.mockImplementationOnce(() => Promise.resolve(response));
            return expect(service.status(clientGUID)).to.be.rejectedWith(FaceXError);
        });

        it('should return false if the result is not ready', function () {
            const response = responseFactory(inProgressStatusResponse) as VideoStatus;
            getVideoStatusMock.mock.mockImplementationOnce(() => Promise.resolve(response));
            return expect(service.status(clientGUID)).to.eventually.be.false;
        });

        it('should return proper data on success', function () {
            const expectedResult: ProcessingStats = {
                detections: 12,
                matches: 375,
                d_archives: 1,
                m_archives: 1,
            };

            const response = responseFactory(
                successfulStatusResponse(
                    expectedResult.detections,
                    expectedResult.matches,
                    expectedResult.d_archives,
                    expectedResult.m_archives,
                ),
            ) as VideoStatus;

            getVideoStatusMock.mock.mockImplementationOnce(() => Promise.resolve(response));
            return expect(service.status(clientGUID)).to.become(expectedResult);
        });
    });

    describe('#getVideoResult()', function () {
        it('should fail on not finished requests', function () {
            const response = responseFactory(inProgressStatusResponse) as VideoStatus;

            getVideoStatusMock.mock.mockImplementationOnce(() => Promise.resolve(response));
            return expect(service.result(clientGUID, 'detect', 1)).to.be.rejectedWith(BadRequestError);
        });

        it('should fail on bad archive numbers', function () {
            const response = responseFactory(successfulStatusResponse(0, 0, 0, 0)) as VideoStatus;

            getVideoStatusMock.mock.mockImplementationOnce(() => Promise.resolve(response));
            return expect(service.result(clientGUID, 'detect', 1)).to.be.rejectedWith(BadRequestError);
        });

        it('should fail on errors', function () {
            getVideoStatusMock.mock.mockImplementationOnce(() =>
                Promise.resolve(responseFactory(successfulStatusResponse(1, 1, 1, 1)) as VideoStatus),
            );

            getVideoResultMock.mock.mockImplementationOnce(() =>
                Promise.resolve(responseFactory(failedVideoResult) as VideoResult),
            );

            return expect(service.result(clientGUID, 'detect', 1)).to.be.rejectedWith(FaceXError);
        });

        it('should return empty buffer if there is no archive', function () {
            getVideoStatusMock.mock.mockImplementationOnce(() =>
                Promise.resolve(responseFactory(successfulStatusResponse(1, 1, 1, 1)) as VideoStatus),
            );

            getVideoResultMock.mock.mockImplementationOnce(() =>
                Promise.resolve(responseFactory(emptyVideoResult) as VideoResult),
            );

            return expect(service.result(clientGUID, 'detect', 1))
                .to.eventually.be.instanceOf(Buffer)
                .and.have.lengthOf(0);
        });
    });

    it('should return non-empty buffer if there is an archive', async function () {
        const expectedString = 'Test';
        getVideoStatusMock.mock.mockImplementationOnce(() =>
            Promise.resolve(responseFactory(successfulStatusResponse(1, 1, 1, 1)) as VideoStatus),
        );

        getVideoResultMock.mock.mockImplementationOnce(() =>
            Promise.resolve(responseFactory(successfulVideoResult(expectedString)) as VideoResult),
        );

        const result = await service.result(clientGUID, 'match', 1);
        expect(result).to.be.instanceOf(Buffer);
        expect(result.toString()).to.equal(expectedString);
    });
});
