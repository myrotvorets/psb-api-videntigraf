import { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { ErrorResponse } from '@myrotvorets/express-microservice-middlewares';

export function uploadErrorHandlerMiddleware(err: unknown, req: Request, res: Response, next: NextFunction): void {
    if (err && typeof err === 'object' && err instanceof MulterError) {
        const response: ErrorResponse = {
            success: false,
            status: 400,
            code: 'BAD_REQUEST',
            message: err.message,
        };

        switch (err.code) {
            case 'LIMIT_PART_COUNT':
            case 'LIMIT_FILE_SIZE':
            case 'LIMIT_FILE_COUNT':
            case 'LIMIT_FIELD_KEY':
            case 'LIMIT_FIELD_VALUE':
            case 'LIMIT_FIELD_COUNT':
            case 'LIMIT_UNEXPECTED_FILE':
                response.code = `UPLOAD_${err.code}`;
                break;

            default:
                break;
        }

        return next(response);
    }

    return next(err);
}
