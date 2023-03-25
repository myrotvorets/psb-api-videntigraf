import express, { NextFunction } from 'express';
import request from 'supertest';
import { errorMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { BadResponseError, FaceXError, HttpError, NetworkError } from '@myrotvorets/facex';
import { BadRequestError } from '../../../src/lib/badrequesterror.mjs';
import { environment } from '../../../src/lib/environment.mjs';
import { UploadError } from '../../../src/lib/uploaderror.mjs';
import { faceXErrorHandlerMiddleware } from '../../../src/middleware/error.mjs';

let app: express.Express;

const env = { ...process.env };

function buildApp(): express.Express {
    process.env = {
        NODE_ENV: 'test',
        PORT: '3030',
        FACEX_URL: 'https://example.com',
    };

    environment();

    const application = express();
    application.disable('x-powered-by');
    return application;
}

beforeEach(() => {
    app = buildApp();
});

afterEach(() => {
    process.env = { ...env };
});

describe('faceXErrorHandlerMiddleware', () => {
    const expectError = (res: request.Response, code: string, status: number): void => {
        expect(res.body).not.toEqual({});
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('code', code);
        expect(res.body).toHaveProperty('status', status);
    };

    const expectBadGateway = (res: request.Response): void => expectError(res, 'BAD_GATEWAY', 502);

    it('should ignore non-errors', () => {
        app.use('/', (req, res, next: NextFunction) => next(123));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware);
        return request(app)
            .get('/')
            .expect(500)
            .expect((res) => {
                expect(res.body).toEqual({});
            });
    });

    it('should catch UploadError', () => {
        app.use('/', (req, res, next: NextFunction) => next(new UploadError('message', 'file')));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware);
        return request(app)
            .get('/')
            .expect(400)
            .expect('Content-Type', /json/u)
            .expect((res) => expectError(res, 'UPLOAD_FAILED', 400));
    });

    it('should catch FaceX HttpError', () => {
        app.use('/', (req, res, next: NextFunction) =>
            next(new HttpError({ status: 418, statusText: "I'm a teapot" })),
        );
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware);
        return request(app).get('/').expect(502).expect('Content-Type', /json/u).expect(expectBadGateway);
    });

    it('should catch FaceX NetworkError', () => {
        app.use('/', (req, res, next: NextFunction) => next(new NetworkError('Boom-boom bye-bye')));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware);
        return request(app).get('/').expect(502).expect('Content-Type', /json/u).expect(expectBadGateway);
    });

    it('should catch FaceX BadResponseError', () => {
        app.use('/', (req, res, next: NextFunction) => next(new BadResponseError('Boom-boom bye-bye')));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware);
        return request(app).get('/').expect(502).expect('Content-Type', /json/u).expect(expectBadGateway);
    });

    it('should catch BadRequestError', () => {
        app.use('/', (req, res, next: NextFunction) => next(new BadRequestError('Boom-boom bye-bye')));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware);
        return request(app)
            .get('/')
            .expect(400)
            .expect('Content-Type', /json/u)
            .expect((res) => expectError(res, 'BAD_REQUEST', 400));
    });

    it('should catch FaceXError', () => {
        app.use('/', (req, res, next: NextFunction) => next(new FaceXError('Boom-boom bye-bye')));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware);
        return request(app)
            .get('/')
            .expect(502)
            .expect('Content-Type', /json/u)
            .expect((res) => expectError(res, 'FACEX_ERROR', 502));
    });
});
