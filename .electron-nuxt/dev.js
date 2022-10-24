require('./check-engines')
process.env.NODE_ENV = 'development'
process.env.DEBUG = 'electron-builder'
require('./index')
