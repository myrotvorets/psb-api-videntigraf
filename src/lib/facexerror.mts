import type { ErrorResponse } from '@myrotvorets/express-microservice-middlewares';
import { FaceXError } from '@myrotvorets/facex';

export function errorResponseFromFaceXError(e: FaceXError): ErrorResponse {
    return {
        success: false,
        status: 502,
        code: 'FACEX_ERROR',
        message: e.message,
    };
}
