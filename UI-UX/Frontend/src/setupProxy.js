const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://127.0.0.1:8080',
      changeOrigin: true,
      secure: false, // Allow self-signed certificates
      onProxyReq: function(proxyReq, req, res) {
        // Add any custom headers if needed
      },
      onProxyRes: function(proxyRes, req, res) {
        // Handle response if needed
      },
      onError: function(err, req, res) {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain'
        });
        res.end('Proxy error: ' + err);
      }
    })
  );
};
