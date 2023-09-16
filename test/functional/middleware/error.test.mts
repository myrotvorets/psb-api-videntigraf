import { afterEach, beforeEach, describe, it } from 'mocha';
import { expect } from 'chai';
import express, { type Express, type NextFunction } from 'express';
import request from 'supertest';
import { errorMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { BadResponseError, FaceXError, HttpError, NetworkError } from '@myrotvorets/facex';
import { BadRequestError } from '../../../src/lib/badrequesterror.mjs';
import { environment } from '../../../src/lib/environment.mjs';
import { UploadError } from '../../../src/lib/uploaderror.mjs';
import { faceXErrorHandlerMiddleware } from '../../../src/middleware/error.mjs';

describe('faceXErrorHandlerMiddleware', () => {
    let app: Express;
    const env = { ...process.env };

    beforeEach(() => {
        process.env = {
            NODE_ENV: 'test',
            PORT: '3030',
            FACEX_URL: 'https://example.com',
        };

        environment();

        app = express();
        app.disable('x-powered-by');
    });

    afterEach(() => {
        process.env = { ...env };
    });

    const expectError = (res: request.Response, code: string, status: number): unknown =>
        expect(res.body).to.be.an('object').and.include({
            success: false,
            code,
            status,
        });

    const expectBadGateway = (res: request.Response): unknown => expectError(res, 'BAD_GATEWAY', 502);

    it('should ignore non-errors', () => {
        app.use('/', (_req, _res, next: NextFunction) => next(123));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware);
        return request(app)
            .get('/')
            .expect(500)
            .expect((res) => expect(res.body).to.deep.equal({}));
    });

    it('should catch UploadError', () => {
        app.use('/', (_req, _res, next: NextFunction) => next(new UploadError('message', 'file')));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware);
        return request(app)
            .get('/')
            .expect(400)
            .expect('Content-Type', /json/u)
            .expect((res) => expectError(res, 'UPLOAD_FAILED', 400));
    });

    it('should catch FaceX HttpError', () => {
        app.use('/', (_req, _res, next: NextFunction) =>
            next(new HttpError({ status: 418, statusText: "I'm a teapot" })),
        );
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware);
        return request(app).get('/').expect(502).expect('Content-Type', /json/u).expect(expectBadGateway);
    });

    it('should catch FaceX NetworkError', () => {
        app.use('/', (_req, _res, next: NextFunction) => next(new NetworkError('Boom-boom bye-bye')));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware);
        return request(app).get('/').expect(502).expect('Content-Type', /json/u).expect(expectBadGateway);
    });

    it('should catch FaceX BadResponseError', () => {
        app.use('/', (_req, _res, next: NextFunction) => next(new BadResponseError('Boom-boom bye-bye')));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware);
        return request(app).get('/').expect(502).expect('Content-Type', /json/u).expect(expectBadGateway);
    });

    it('should catch BadRequestError', () => {
        app.use('/', (_req, _res, next: NextFunction) => next(new BadRequestError('Boom-boom bye-bye')));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware);
        return request(app)
            .get('/')
            .expect(400)
            .expect('Content-Type', /json/u)
            .expect((res) => expectError(res, 'BAD_REQUEST', 400));
    });

    it('should catch FaceXError', () => {
        app.use('/', (_req, _res, next: NextFunction) => next(new FaceXError('Boom-boom bye-bye')));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware);
        return request(app)
            .get('/')
            .expect(502)
            .expect('Content-Type', /json/u)
            .expect((res) => expectError(res, 'FACEX_ERROR', 502));
    });
});
