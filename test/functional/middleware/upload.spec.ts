import express, { NextFunction } from 'express';
import request from 'supertest';
import { errorMiddleware } from '@myrotvorets/express-microservice-middlewares';
import { ErrorCode, MulterError } from 'multer';
import { uploadErrorHandlerMiddleware } from '../../../src/middleware/upload.mjs';
import { environment } from '../../../src/lib/environment.mjs';

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

describe('uploadErrorHandlerMiddleware', () => {
    it('should not modify non-multer errors', () => {
        app.use('/', (req, res, next: NextFunction) => next(new Error()));
        app.use(uploadErrorHandlerMiddleware);
        app.use(errorMiddleware);
        return request(app)
            .get('/')
            .expect(500)
            .expect('Content-Type', /json/u)
            .expect((res) => {
                expect(res.body).not.toEqual({});
                expect(res.body).toHaveProperty('code', 'UNKNOWN_ERROR');
            });
    });

    it.each<[ErrorCode, string]>([
        ['LIMIT_PART_COUNT', 'UPLOAD_LIMIT_PART_COUNT'],
        ['LIMIT_FILE_SIZE', 'UPLOAD_LIMIT_FILE_SIZE'],
        ['LIMIT_FILE_COUNT', 'UPLOAD_LIMIT_FILE_COUNT'],
        ['LIMIT_FIELD_KEY', 'UPLOAD_LIMIT_FIELD_KEY'],
        ['LIMIT_FIELD_VALUE', 'UPLOAD_LIMIT_FIELD_VALUE'],
        ['LIMIT_FIELD_COUNT', 'UPLOAD_LIMIT_FIELD_COUNT'],
        ['LIMIT_UNEXPECTED_FILE', 'UPLOAD_LIMIT_UNEXPECTED_FILE'],
        ['OTHER_ERROR' as ErrorCode, 'BAD_REQUEST'],
    ])('should properly handle Multer errors (%s => %s)', (error, expectedCode) => {
        app.use('/', (req, res, next: NextFunction) => next(new MulterError(error)));
        app.use(uploadErrorHandlerMiddleware);
        app.use(errorMiddleware);
        return request(app)
            .get('/')
            .expect(400)
            .expect('Content-Type', /json/u)
            .expect((res) => {
                expect(res.body).not.toEqual({});
                expect(res.body).toHaveProperty('code', expectedCode);
            });
    });
});
