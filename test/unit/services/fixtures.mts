import type { RawResponse } from '@myrotvorets/facex';

export const fakeFile: Express.Multer.File = {
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

export const clientGUID = '00000000-0000-0000-0000-000000000000';

export const failedVideoUploadResponse: RawResponse = {
    ans_type: 241,
    signature: '',
    data: {
        id: 'x',
        client_id: 'facex/node',
        reqID_serv: '00000000-0000-0000-0000-000000000000',
        reqID_clnt: clientGUID,
        segment: '0',
        datetime: new Date().toISOString(),
        result_code: -1,
        results_amount: 0,
        comment: 'In the long run, we are all dead.',
        fotos: [],
    },
};

export const successfulVideoUploadResponse = (expectedGUID: string): RawResponse => ({
    ans_type: 241,
    signature: '',
    data: {
        id: 'x',
        client_id: 'facex/node',
        reqID_serv: expectedGUID,
        reqID_clnt: clientGUID,
        segment: '0',
        datetime: new Date().toISOString(),
        result_code: 1,
        results_amount: 0,
        comment: 'AQ=0/BQ=0/CQ=1;',
        fotos: [],
    },
});

export const failedStatusResponse: RawResponse = {
    ans_type: 243,
    signature: '',
    data: {
        id: 'x',
        client_id: 'x',
        reqID_serv: '00000000-0000-0000-0000-000000000000',
        reqID_clnt: clientGUID,
        segment: '',
        datetime: new Date().toISOString(),
        result_code: -1,
        results_amount: 0,
        comment: 'Error',
        fotos: [],
    },
};

export const inProgressStatusResponse: RawResponse = {
    ans_type: 243,
    signature: '',
    data: {
        id: 'x',
        client_id: 'x',
        reqID_serv: '00000000-0000-0000-0000-000000000000',
        reqID_clnt: clientGUID,
        segment: '',
        datetime: Date.now().toString(),
        result_code: 2,
        results_amount: 0,
        comment: 'step:2;play_time:109/15;',
        fotos: [],
    },
};

export const successfulStatusResponse = (
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
        reqID_clnt: clientGUID,
        segment: '',
        datetime: Date.now().toString(),
        result_code: 3,
        results_amount: 0,
        comment: `step:7;task finished;d:${detections};m:${matches};d_arx:${d_archives};m_arx:${m_archives};`,
        fotos: [],
    },
});

export const failedVideoResult: RawResponse = {
    ans_type: 245,
    signature: '',
    data: {
        id: 'x',
        client_id: 'facex/node',
        reqID_serv: '00000000-0000-0000-0000-000000000000',
        reqID_clnt: clientGUID,
        segment: null,
        datetime: Date.now().toString(),
        result_code: -1,
        results_amount: 0,
        comment: 'OMG',
        fotos: [],
    },
};

export const emptyVideoResult: RawResponse = {
    ans_type: 245,
    signature: '',
    data: {
        id: 'x',
        client_id: 'facex/node',
        reqID_serv: '00000000-0000-0000-0000-000000000000',
        reqID_clnt: clientGUID,
        segment: null,
        datetime: Date.now().toString(),
        result_code: 3,
        results_amount: 0,
        comment: 'ready',
        fotos: [],
    },
};

export const successfulVideoResult = (data: string): RawResponse => ({
    ans_type: 245,
    signature: '',
    data: {
        id: 'x',
        client_id: 'facex/node',
        reqID_serv: '00000000-0000-0000-0000-000000000000',
        reqID_clnt: clientGUID,
        segment: null,
        datetime: Date.now().toString(),
        result_code: 3,
        results_amount: 0,
        comment: 'ready',
        fotos: [
            {
                foto: Buffer.from(data).toString('base64'),
                par1: 0,
                par2: 0,
                par3: 0,
                namef: 'm_00000000-0000-0000-0000-000000000000.zip.001',
                namel: null,
                path: null,
            },
        ],
    },
});
