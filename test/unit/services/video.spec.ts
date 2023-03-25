/* eslint-disable class-methods-use-this */
import {
    FaceXError,
    FaceXVideoClient,
    RawResponse,
    VideoResult,
    VideoStatus,
    VideoUploadAck,
    responseFactory,
} from '@myrotvorets/facex';
import { ProcessingStats, VideoService } from '../../../src/services/video.mjs';
import { UploadError } from '../../../src/lib/uploaderror.mjs';
import { BadRequestError } from '../../../src/lib/badrequesterror.mjs';

const uploadVideo = jest.fn() as jest.Mock<
    Promise<VideoUploadAck>,
    [Buffer | string | NodeJS.ReadableStream, undefined | 'A' | 'B' | 'C']
>;

const getVideoStatus = jest.fn() as jest.Mock<Promise<VideoStatus>, [string]>;
const getVideoResult = jest.fn() as jest.Mock<Promise<VideoResult>, [string, 'detect' | 'match', undefined | number]>;

class FakeFaceXVideoClient extends FaceXVideoClient {
    public uploadVideo(
        video: Buffer | string | NodeJS.ReadableStream,
        priority?: 'A' | 'B' | 'C',
    ): Promise<VideoUploadAck> {
        return uploadVideo(video, priority);
    }

    public getVideoStatus(guid: string): Promise<VideoStatus> {
        return getVideoStatus(guid);
    }

    public getVideoResult(guid: string, type: 'detect' | 'match', archiveNumber?: number): Promise<VideoResult> {
        return getVideoResult(guid, type, archiveNumber);
    }
}

const service = new VideoService(new FakeFaceXVideoClient('https://example.com', 'client_id'));

beforeEach(() => jest.resetAllMocks());

const fakeFile: Express.Multer.File = {
    fieldname: 'video',
    originalname: 'test.mp4',
    encoding: 'binary',
    mimetype: 'video/mp4',
    size: 1048576,
    stream: null,
    destination: '/tmp',
    filename: 'test.mp4',
    path: '',
    buffer: Buffer.from(''),
};

const failedStatusResponse: RawResponse = {
    ans_type: 243,
    signature: '',
    data: {
        id: 'x',
        client_id: 'x',
        reqID_serv: '00000000-0000-0000-0000-000000000000',
        reqID_clnt: '00000000-0000-0000-0000-000000000000',
        segment: '',
        datetime: new Date().toISOString(),
        result_code: -1,
        results_amount: 0,
        comment: 'Error',
        fotos: [],
    },
};

const inProgressStatusResponse: RawResponse = {
    ans_type: 243,
    signature: '',
    data: {
        id: 'x',
        client_id: 'x',
        reqID_serv: '00000000-0000-0000-0000-000000000000',
        reqID_clnt: '00000000-0000-0000-0000-000000000000',
        segment: '',
        datetime: Date.now().toString(),
        result_code: 2,
        results_amount: 0,
        comment: 'step:2;play_time:109/15;',
        fotos: [],
    },
};

const successfulStatusResponse = (
    detections: number,
    matches: number,
    d_archives: number,
    m_archives: number,
): RawResponse => ({
    ans_type: 243,
    signature: '',
    data: {
        id: 'x',
        client_id: 'x',
        reqID_serv: '00000000-0000-0000-0000-000000000000',
        reqID_clnt: '00000000-0000-0000-0000-000000000000',
        segment: '',
        datetime: Date.now().toString(),
        result_code: 3,
        results_amount: 0,
        comment: `step:7;task finished;d:${detections};m:${matches};d_arx:${d_archives};m_arx:${m_archives};`,
        fotos: [],
    },
});

describe('VideoService', () => {
    describe('#upload()', () => {
        it('should fail on error', () => {
            const response = responseFactory({
                ans_type: 241,
                signature: '',
                data: {
                    id: 'x',
                    client_id: 'facex/node',
                    reqID_serv: '00000000-0000-0000-0000-000000000000',
                    reqID_clnt: '00000000-0000-0000-0000-000000000000',
                    segment: '0',
                    datetime: new Date().toISOString(),
                    result_code: -1,
                    results_amount: 0,
                    comment: 'In the long run, we are all dead.',
                    fotos: [],
                },
            }) as VideoUploadAck;

            uploadVideo.mockResolvedValue(response);
            return expect(service.upload(fakeFile)).rejects.toBeInstanceOf(UploadError);
        });

        it('should return GUID on success', () => {
            const expectedGUID = '00000000-0000-0000-0000-000000000001';
            const response = responseFactory({
                ans_type: 241,
                signature: '',
                data: {
                    id: 'x',
                    client_id: 'facex/node',
                    reqID_serv: expectedGUID,
                    reqID_clnt: '00000000-0000-0000-0000-000000000000',
                    segment: '0',
                    datetime: new Date().toISOString(),
                    result_code: 1,
                    results_amount: 0,
                    comment: 'AQ=0/BQ=0/CQ=1;',
                    fotos: [],
                },
            }) as VideoUploadAck;

            uploadVideo.mockResolvedValue(response);
            return expect(service.upload(fakeFile)).resolves.toBe(expectedGUID);
        });
    });

    describe('#getVideoStatus()', () => {
        it('should fail on error', () => {
            const response = responseFactory(failedStatusResponse) as VideoStatus;

            getVideoStatus.mockResolvedValue(response);
            return expect(service.status('00000000-0000-0000-0000-000000000000')).rejects.toThrow(FaceXError);
        });

        it('should return false if the result is not ready', () => {
            const response = responseFactory(inProgressStatusResponse) as VideoStatus;

            getVideoStatus.mockResolvedValue(response);
            return expect(service.status('00000000-0000-0000-0000-000000000000')).resolves.toBe(false);
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

            getVideoStatus.mockResolvedValue(response);
            return expect(service.status('00000000-0000-0000-0000-000000000000')).resolves.toStrictEqual(
                expectedResult,
            );
        });
    });

    describe('#getVideoResult()', () => {
        it('should fail on not finished requests', () => {
            const response = responseFactory(inProgressStatusResponse) as VideoStatus;

            getVideoStatus.mockResolvedValue(response);
            return expect(service.result('00000000-0000-0000-0000-000000000000', 'detect', 1)).rejects.toThrow(
                BadRequestError,
            );
        });

        it('should fail on bad archive numbers', () => {
            const response = responseFactory(successfulStatusResponse(0, 0, 0, 0)) as VideoStatus;
            getVideoStatus.mockResolvedValue(response);
            return expect(service.result('00000000-0000-0000-0000-000000000000', 'detect', 1)).rejects.toThrow(
                BadRequestError,
            );
        });

        it('should fail on errors', () => {
            getVideoStatus.mockResolvedValue(responseFactory(successfulStatusResponse(1, 1, 1, 1)) as VideoStatus);
            getVideoResult.mockResolvedValue(
                responseFactory({
                    ans_type: 245,
                    signature: '',
                    data: {
                        id: 'x',
                        client_id: 'facex/node',
                        reqID_serv: '00000000-0000-0000-0000-000000000000',
                        reqID_clnt: '00000000-0000-0000-0000-000000000000',
                        segment: null,
                        datetime: Date.now().toString(),
                        result_code: -1,
                        results_amount: 0,
                        comment: 'OMG',
                        fotos: [],
                    },
                }) as VideoResult,
            );

            return expect(service.result('00000000-0000-0000-0000-000000000000', 'detect', 1)).rejects.toThrow(
                FaceXError,
            );
        });

        it('should return empty buffer if there is no archive', async () => {
            getVideoStatus.mockResolvedValue(responseFactory(successfulStatusResponse(1, 1, 1, 1)) as VideoStatus);
            getVideoResult.mockResolvedValue(
                responseFactory({
                    ans_type: 245,
                    signature: '',
                    data: {
                        id: 'x',
                        client_id: 'facex/node',
                        reqID_serv: '00000000-0000-0000-0000-000000000000',
                        reqID_clnt: '00000000-0000-0000-0000-000000000000',
                        segment: null,
                        datetime: Date.now().toString(),
                        result_code: 3,
                        results_amount: 0,
                        comment: 'ready',
                        fotos: [],
                    },
                }) as VideoResult,
            );

            const result = await service.result('00000000-0000-0000-0000-000000000000', 'detect', 1);
            expect(result).toBeInstanceOf(Buffer);
            expect(result).toHaveLength(0);
        });
    });

    it('should return non-empty buffer if there is an archive', async () => {
        const expectedString = 'Test';
        getVideoStatus.mockResolvedValue(responseFactory(successfulStatusResponse(1, 1, 1, 1)) as VideoStatus);
        getVideoResult.mockResolvedValue(
            responseFactory({
                ans_type: 245,
                signature: '',
                data: {
                    id: 'x',
                    client_id: 'facex/node',
                    reqID_serv: '00000000-0000-0000-0000-000000000000',
                    reqID_clnt: '00000000-0000-0000-0000-000000000000',
                    segment: null,
                    datetime: Date.now().toString(),
                    result_code: 3,
                    results_amount: 0,
                    comment: 'ready',
                    fotos: [
                        {
                            foto: Buffer.from(expectedString).toString('base64'),
                            par1: 0,
                            par2: 0,
                            par3: 0,
                            namef: 'm_00000000-0000-0000-0000-000000000000.zip.001',
                            namel: null,
                            path: null,
                        },
                    ],
                },
            }) as VideoResult,
        );

        const result = await service.result('00000000-0000-0000-0000-000000000000', 'match', 1);
        expect(result).toBeInstanceOf(Buffer);
        expect(result.toString()).toBe(expectedString);
    });
});
