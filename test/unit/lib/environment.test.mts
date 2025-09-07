import { expect } from 'chai';
import { type Environment, environment } from '../../../src/lib/environment.mjs';

describe('environment', function () {
    let env: typeof process.env;

    before(function () {
        env = { ...process.env };
    });

    afterEach(function () {
        process.env = { ...env };
    });

    it('should ignore extra variables', function () {
        const expected: Environment = {
            NODE_ENV: 'development',
            PORT: 3000,
            VIDENTIGRAF_MAX_FILE_SIZE: 0,
            FACEX_URL: 'https://example.com',
        };

        process.env = {
            NODE_ENV: expected.NODE_ENV,
            PORT: `${expected.PORT}`,
            EXTRA: 'xxx',
            VIDENTIGRAF_MAX_FILE_SIZE: `${expected.VIDENTIGRAF_MAX_FILE_SIZE}`,
            FACEX_URL: expected.FACEX_URL,
        };

        const actual = { ...environment(true) };
        expect(actual).to.deep.equal(expected);
    });

    it('should cache the result', function () {
        const expected: Environment = {
            NODE_ENV: 'staging',
            PORT: 3030,
            VIDENTIGRAF_MAX_FILE_SIZE: 0,
            FACEX_URL: 'https://example.com',
        };

        process.env = {
            NODE_ENV: expected.NODE_ENV,
            PORT: `${expected.PORT}`,
            VIDENTIGRAF_MAX_FILE_SIZE: `${expected.VIDENTIGRAF_MAX_FILE_SIZE}`,
            FACEX_URL: expected.FACEX_URL,
        };

        let actual = { ...environment(true) };
        expect(actual).to.deep.equal(expected);

        process.env = {
            NODE_ENV: `${expected.NODE_ENV}${expected.NODE_ENV}`,
            PORT: `1${expected.PORT}`,
            VIDENTIGRAF_MAX_FILE_SIZE: `${expected.VIDENTIGRAF_MAX_FILE_SIZE}`,
            FACEX_URL: expected.FACEX_URL,
        };

        actual = { ...environment() };
        expect(actual).to.deep.equal(expected);
    });
});
