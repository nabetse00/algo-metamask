module.exports = {
    bundler: 'webpack', 
    input: 'src/index.js',
    output: {
      path: 'dist',
    },
    server: {
      port: 9000,
    },
    polyfills: {
      buffer: true,
      querystring: true,
      crypto: true
    },
  };