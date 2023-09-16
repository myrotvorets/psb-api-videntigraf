import { describe, it } from 'mocha';
import { expect } from 'chai';
import { matchers, when } from 'testdouble';
import {
    FaceXError,
    type VideoResult,
    type VideoStatus,
    type VideoType,
    type VideoUploadAck,
    type VideoUploadPriority,
    responseFactory,
} from '@myrotvorets/facex';
import { type ProcessingStats, VideoService } from '../../../src/services/video.mjs';
import { UploadError } from '../../../src/lib/uploaderror.mjs';
import { BadRequestError } from '../../../src/lib/badrequesterror.mjs';
import { FakeFaceXVideoClient, getVideoResult, getVideoStatus, uploadVideo } from './fakeclient.mjs';
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

describe('VideoService', () => {
    const service = new VideoService(new FakeFaceXVideoClient('https://example.com', 'client_id'));

    describe('#upload()', () => {
        it('should fail on error', () => {
            const response = responseFactory(failedVideoUploadResponse) as VideoUploadAck;

            when(uploadVideo(matchers.anything() as VideoType, matchers.anything() as VideoUploadPriority)).thenResolve(
                response,
            );
            return expect(service.upload(fakeFile)).to.be.rejectedWith(UploadError);
        });

        it('should return GUID on success', () => {
            const expectedGUID = '00000000-0000-0000-0000-000000000001';
            const response = responseFactory(successfulVideoUploadResponse(expectedGUID)) as VideoUploadAck;

            when(uploadVideo(matchers.anything() as VideoType, matchers.anything() as VideoUploadPriority)).thenResolve(
                response,
            );

            return expect(service.upload(fakeFile)).to.become(expectedGUID);
        });
    });

    describe('#getVideoStatus()', () => {
        it('should fail on error', () => {
            const response = responseFactory(failedStatusResponse) as VideoStatus;

            when(getVideoStatus(clientGUID)).thenResolve(response);
            return expect(service.status(clientGUID)).to.be.rejectedWith(FaceXError);
        });

        it('should return false if the result is not ready', () => {
            const response = responseFactory(inProgressStatusResponse) as VideoStatus;

            when(getVideoStatus(clientGUID)).thenResolve(response);
            return expect(service.status(clientGUID)).to.eventually.be.false;
        });

        it('should return proper data on success', () => {
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

            when(getVideoStatus(clientGUID)).thenResolve(response);
            return expect(service.status(clientGUID)).to.become(expectedResult);
        });
    });

    describe('#getVideoResult()', () => {
        it('should fail on not finished requests', () => {
            const response = responseFactory(inProgressStatusResponse) as VideoStatus;

            when(getVideoStatus(clientGUID)).thenResolve(response);
            return expect(service.result(clientGUID, 'detect', 1)).to.be.rejectedWith(BadRequestError);
        });

        it('should fail on bad archive numbers', () => {
            const response = responseFactory(successfulStatusResponse(0, 0, 0, 0)) as VideoStatus;

            when(getVideoStatus(clientGUID)).thenResolve(response);
            return expect(service.result(clientGUID, 'detect', 1)).to.be.rejectedWith(BadRequestError);
        });

        it('should fail on errors', () => {
            when(getVideoStatus(clientGUID)).thenResolve(
                responseFactory(successfulStatusResponse(1, 1, 1, 1)) as VideoStatus,
            );

            when(getVideoResult(clientGUID, 'detect', 1)).thenResolve(
                responseFactory(failedVideoResult) as VideoResult,
            );

            return expect(service.result(clientGUID, 'detect', 1)).to.be.rejectedWith(FaceXError);
        });

        it('should return empty buffer if there is no archive', () => {
            when(getVideoStatus(clientGUID)).thenResolve(
                responseFactory(successfulStatusResponse(1, 1, 1, 1)) as VideoStatus,
            );

            when(getVideoResult(clientGUID, 'detect', 1)).thenResolve(responseFactory(emptyVideoResult) as VideoResult);

            return expect(service.result(clientGUID, 'detect', 1))
                .to.eventually.be.instanceOf(Buffer)
                .and.have.lengthOf(0);
        });
    });

    it('should return non-empty buffer if there is an archive', async () => {
        const expectedString = 'Test';

        when(getVideoStatus(clientGUID)).thenResolve(
            responseFactory(successfulStatusResponse(1, 1, 1, 1)) as VideoStatus,
        );

        when(getVideoResult(clientGUID, 'match', 1)).thenResolve(
            responseFactory(successfulVideoResult(expectedString)) as VideoResult,
        );

        const result = await service.result(clientGUID, 'match', 1);
        expect(result).to.be.instanceOf(Buffer);
        expect(result.toString()).to.equal(expectedString);
    });
});
