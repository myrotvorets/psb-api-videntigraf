import type { RequestListener } from 'node:http';
import { expect } from 'chai';
import type { Express, NextFunction } from 'express';
import request from 'supertest';
import { errorMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { BadResponseError, FaceXError, HttpError, NetworkError } from '@myrotvorets/facex';
import { BadRequestError } from '../../../src/lib/badrequesterror.mjs';
import { UploadError } from '../../../src/lib/uploaderror.mjs';
import { faceXErrorHandlerMiddleware } from '../../../src/middleware/error.mjs';
import { createApp } from '../../../src/server.mjs';

describe('faceXErrorHandlerMiddleware', function () {
    let app: Express;

    beforeEach(function () {
        app = createApp();
    });

    const expectError = (res: request.Response, code: string, status: number): unknown =>
        expect(res.body).to.be.an('object').and.include({
            success: false,
            code,
            status,
        });

    const expectBadGateway = (res: request.Response): unknown => expectError(res, 'BAD_GATEWAY', 502);

    it('should ignore non-errors', function () {
        app.use('/', (_req, _res, next: NextFunction) => next(123));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware());
        return request(app as RequestListener)
            .get('/')
            .expect(500)
            .expect((res) => expect(res.body).to.deep.equal({}));
    });

    it('should catch UploadError', function () {
        app.use('/', (_req, _res, next: NextFunction) => next(new UploadError('message', 'file')));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware());
        return request(app as RequestListener)
            .get('/')
            .expect(400)
            .expect('Content-Type', /json/u)
            .expect((res) => expectError(res, 'UPLOAD_FAILED', 400));
    });

    it('should catch FaceX HttpError', function () {
        app.use('/', (_req, _res, next: NextFunction) =>
            next(new HttpError({ status: 418, statusText: "I'm a teapot" })),
        );
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware());
        return request(app as RequestListener)
            .get('/')
            .expect(500)
            .expect('Content-Type', /json/u)
            .expect(expectBadGateway);
    });

    it('should catch FaceX NetworkError', function () {
        app.use('/', (_req, _res, next: NextFunction) => next(new NetworkError('Boom-boom bye-bye')));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware());
        return request(app as RequestListener)
            .get('/')
            .expect(500)
            .expect('Content-Type', /json/u)
            .expect(expectBadGateway);
    });

    it('should catch FaceX BadResponseError', function () {
        app.use('/', (_req, _res, next: NextFunction) => next(new BadResponseError('Boom-boom bye-bye')));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware());
        return request(app as RequestListener)
            .get('/')
            .expect(500)
            .expect('Content-Type', /json/u)
            .expect(expectBadGateway);
    });

    it('should catch BadRequestError', function () {
        app.use('/', (_req, _res, next: NextFunction) => next(new BadRequestError('Boom-boom bye-bye')));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware());
        return request(app as RequestListener)
            .get('/')
            .expect(400)
            .expect('Content-Type', /json/u)
            .expect((res) => expectError(res, 'BAD_REQUEST', 400));
    });

    it('should catch FaceXError', function () {
        app.use('/', (_req, _res, next: NextFunction) => next(new FaceXError('Boom-boom bye-bye')));
        app.use(faceXErrorHandlerMiddleware);
        app.use(errorMiddleware());
        return request(app as RequestListener)
            .get('/')
            .expect(500)
            .expect('Content-Type', /json/u)
            .expect((res) => expectError(res, 'FACEX_ERROR', 502));
    });
});
