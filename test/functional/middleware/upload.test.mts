import { expect } from 'chai';
import type { Express, NextFunction } from 'express';
import request from 'supertest';
import { errorMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { type ErrorCode, MulterError } from 'multer';
import { uploadErrorHandlerMiddleware } from '../../../src/middleware/upload.mjs';
import { createApp } from '../../../src/server.mjs';

describe('uploadErrorHandlerMiddleware', function () {
    let app: Express;

    beforeEach(function () {
        app = createApp();
    });

    it('should not modify non-multer errors', function () {
        app.use('/', (_req, _res, next: NextFunction) => next(new Error()));
        app.use(uploadErrorHandlerMiddleware);
        app.use(errorMiddleware);
        return request(app)
            .get('/')
            .expect(500)
            .expect('Content-Type', /json/u)
            .expect((res) => expect(res.body).to.be.an('object').and.have.property('code', 'UNKNOWN_ERROR'));
    });

    const table: [ErrorCode, string][] = [
        ['LIMIT_PART_COUNT', 'UPLOAD_LIMIT_PART_COUNT'],
        ['LIMIT_FILE_SIZE', 'UPLOAD_LIMIT_FILE_SIZE'],
        ['LIMIT_FILE_COUNT', 'UPLOAD_LIMIT_FILE_COUNT'],
        ['LIMIT_FIELD_KEY', 'UPLOAD_LIMIT_FIELD_KEY'],
        ['LIMIT_FIELD_VALUE', 'UPLOAD_LIMIT_FIELD_VALUE'],
        ['LIMIT_FIELD_COUNT', 'UPLOAD_LIMIT_FIELD_COUNT'],
        ['LIMIT_UNEXPECTED_FILE', 'UPLOAD_LIMIT_UNEXPECTED_FILE'],
        ['OTHER_ERROR' as ErrorCode, 'BAD_REQUEST'],
    ];

    // eslint-disable-next-line mocha/no-setup-in-describe
    table.forEach(([error, expectedCode]) => {
        it(`should properly handle Multer errors (${error} => ${expectedCode})`, function () {
            app.use('/', (_req, _res, next: NextFunction) => next(new MulterError(error)));
            app.use(uploadErrorHandlerMiddleware);
            app.use(errorMiddleware);
            return request(app)
                .get('/')
                .expect(400)
                .expect('Content-Type', /json/u)
                .expect((res) => expect(res.body).to.be.an('object').and.have.property('code', expectedCode));
        });
    });
});
