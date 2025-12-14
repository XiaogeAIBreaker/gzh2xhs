/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
    options: {
        doNotFollow: { path: 'node_modules' },
        includeOnly: ['^src'],
        reporterOptions: { dot: { collapsePattern: 'node_modules' } },
    },
    forbidden: [
        {
            name: 'no-cycles',
            severity: 'error',
            from: {},
            to: { circular: true },
        },
        {
            name: 'no-orphans',
            severity: 'warn',
            from: { orphan: true },
            to: {},
        },
        {
            name: 'layering-domain-lowest',
            severity: 'error',
            from: { path: '^src/(domain|shared)\\b' },
            to: { path: '^src/(application|interfaces|app|components)\\b' },
        },
        {
            name: 'ui-no-direct-backend',
            severity: 'warn',
            from: { path: '^src/components\\b' },
            to: { path: '^src/(interfaces|shared/lib/redis)\\b' },
        },
    ],
}
