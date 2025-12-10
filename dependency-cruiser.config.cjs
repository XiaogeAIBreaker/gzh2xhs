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
  ],
}
