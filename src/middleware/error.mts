import type { NextFunction, Request, Response } from 'express';
import { badGatewayFromError } from '@myrotvorets/express-microservice-middlewares';
import { BadResponseError, FaceXError, HttpError, NetworkError } from '@myrotvorets/facex';
import { UploadError } from '../lib/uploaderror.mjs';
import { errorResponseFromFaceXError } from '../lib/facexerror.mjs';
import { BadRequestError } from '../lib/badrequesterror.mjs';

export function faceXErrorHandlerMiddleware(err: unknown, req: Request, res: Response, next: NextFunction): void {
    if (err && typeof err === 'object') {
        if (err instanceof UploadError) {
            next({
                success: false,
                status: 400,
                code: 'UPLOAD_FAILED',
                message: `${err.message} (${err.file})`,
            });
            return;
        }

        if (err instanceof HttpError || err instanceof NetworkError || err instanceof BadResponseError) {
            next(badGatewayFromError(err));
            return;
        }

        if (err instanceof BadRequestError) {
            next({
                success: false,
                status: 400,
                code: 'BAD_REQUEST',
                message: `${err.message}`,
            });
            return;
        }

        if (err instanceof FaceXError) {
            next(errorResponseFromFaceXError(err));
            return;
        }
    }

    next(err);
}
