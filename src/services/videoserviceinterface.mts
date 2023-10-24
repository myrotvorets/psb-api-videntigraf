export interface ProcessingStats {
    detections: number;
    matches: number;
    d_archives: number;
    m_archives: number;
}

export interface VideoServiceInterface {
    upload(file: Express.Multer.File): Promise<string>;
    status(guid: string): Promise<ProcessingStats | false>;
    result(guid: string, type: 'match' | 'detect', n: number): Promise<Buffer>;
}
