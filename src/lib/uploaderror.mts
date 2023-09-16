export class UploadError extends Error {
    public file: string;

    public constructor(message: string, file: string, options?: ErrorOptions) {
        super(message, options);
        this.file = file;
        this.name = 'UploadError';
    }
}
