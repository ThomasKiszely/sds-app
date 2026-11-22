const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    {
        ignores: ['node_modules/**', 'coverage/**', 'public/js/*.min.js'],
    },
    js.configs.recommended,
    {
        // Server-kode (CommonJS)
        files: ['server.js', 'src/**/*.js', 'scripts/**/*.js', 'eslint.config.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: globals.node,
        },
    },
    {
        // Frontend-scripts der loades direkte i browseren
        files: ['public/js/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: { ...globals.browser, htmx: 'readonly', Sortable: 'readonly' },
        },
    },
    {
        files: ['test/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.node },
        },
    },
    {
        rules: {
            // Tomme catch-blokke bruges bevidst til "best effort"-kode i frontend
            'no-empty': ['error', { allowEmptyCatch: true }],
            'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_|^next$|^req$|^res$', caughtErrors: 'none' }],
        },
    },
];
