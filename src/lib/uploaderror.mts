export class UploadError extends Error {
    public file: string;

    public constructor(message: string, file: string) {
        super(message);
        this.file = file;
        this.name = 'UploadError';
    }
}
