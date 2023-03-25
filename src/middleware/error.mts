import type { NextFunction, Request, Response } from 'express';
import { badGatewayFromError } from '@myrotvorets/express-microservice-middlewares';
import { BadResponseError, FaceXError, HttpError, NetworkError } from '@myrotvorets/facex';
import { UploadError } from '../lib/uploaderror.mjs';
import { errorResponseFromFaceXError } from '../lib/facexerror.mjs';
import { BadRequestError } from '../lib/badrequesterror.mjs';

export function faceXErrorHandlerMiddleware(err: unknown, req: Request, res: Response, next: NextFunction): void {
    if (err && typeof err === 'object') {
        if (err instanceof UploadError) {
            return next({
                success: false,
                status: 400,
                code: 'UPLOAD_FAILED',
                message: `${err.message} (${err.file})`,
            });
        }

        if (err instanceof HttpError || err instanceof NetworkError || err instanceof BadResponseError) {
            return next(badGatewayFromError(err));
        }

        if (err instanceof BadRequestError) {
            return next({
                success: false,
                status: 400,
                code: 'BAD_REQUEST',
                message: `${err.message}`,
            });
        }

        if (err instanceof FaceXError) {
            return next(errorResponseFromFaceXError(err));
        }
    }

    return next(err);
}
