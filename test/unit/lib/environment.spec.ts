import { Environment, environment } from '../../../src/lib/environment.mjs';

describe('environment', () => {
    const env = { ...process.env };

    afterEach(() => (process.env = { ...env }));

    it('should ignore extra variables', () => {
        const expected: Environment = {
            NODE_ENV: 'development',
            PORT: 3000,
            VIDENTIGRAF_MAX_FILE_SIZE: 0,
            FACEX_URL: 'https://example.com',
        };

        process.env = {
            NODE_ENV: `${expected.NODE_ENV}`,
            PORT: `${expected.PORT}`,
            EXTRA: 'xxx',
            VIDENTIGRAF_MAX_FILE_SIZE: `${expected.VIDENTIGRAF_MAX_FILE_SIZE}`,
            FACEX_URL: `${expected.FACEX_URL}`,
        };

        const actual = { ...environment() };
        expect(actual).toStrictEqual(expected);
    });

    it('should cache the result', () => {
        const expected: Environment = {
            NODE_ENV: 'staging',
            PORT: 3030,
            VIDENTIGRAF_MAX_FILE_SIZE: 0,
            FACEX_URL: 'https://example.com',
        };

        process.env = {
            NODE_ENV: `${expected.NODE_ENV}`,
            PORT: `${expected.PORT}`,
            VIDENTIGRAF_MAX_FILE_SIZE: `${expected.VIDENTIGRAF_MAX_FILE_SIZE}`,
            FACEX_URL: `${expected.FACEX_URL}`,
        };

        let actual = { ...environment(true) };
        expect(actual).toStrictEqual(expected);

        process.env = {
            NODE_ENV: `${expected.NODE_ENV}${expected.NODE_ENV}`,
            PORT: `1${expected.PORT}`,
            VIDENTIGRAF_MAX_FILE_SIZE: `${expected.VIDENTIGRAF_MAX_FILE_SIZE}`,
            FACEX_URL: `${expected.FACEX_URL}`,
        };

        actual = { ...environment() };
        expect(actual).toStrictEqual(expected);
    });
});
