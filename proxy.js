var http = require('http');
var httpProxy = require('http-proxy');
var querystring = require('querystring');
var argv = require('yargs')
    .usage('Usage: $0 [options]')
    .default({'cdh-protocol': 'http', 'cdh-host': '127.0.0.1', 'cdh-port': '7180', 'proxy-port': '5050'})
    .describe('cdh-protocol', "Protocol to use")
    .describe('cdh-host', "Host of CDH Manager")
    .describe('cdh-port', "Port of CDH Manager")
    .describe('proxy-port', "Port of this proxy server")
    .describe('user', "Username use to login to CDH Manager")
    .describe('password', "Password use to login to CDH Manager")
    .alias('cp', 'cdh-protocol')
    .alias('ch', 'cdh-host')
    .alias('cpo', 'cdh-port')
    .alias('pp', 'proxy-port')
    .alias('u', 'user')
    .alias('p', 'password')
    .demandOption(['u', 'p'])
    .help('h')
    .example('npm start -- --cp=https --ch=<target_host> -u=<username> -p=<password>'
        , 'will proxy on https://<target_host>:7180')
    .argv;

//
// Create a proxy server with custom application logic
//
var proxy = httpProxy.createProxyServer({});
var proxy_target = argv.cp+'://'+argv.ch+':'+argv.cpo;

//
// Create your custom server and just call `proxy.web()` to proxy
// a web request to the target passed in the options
// also you can use `proxy.ws()` to proxy a websockets request
//

proxy.on('proxyReq', function(proxyReq, req, res, options) {
  //proxyReq.write(post_data);
  console.log("request from:", req.connection.remoteAddress);
  if(req.url.startsWith("/cmf/login")) {
    var _url = req.url.split('?');
    var post_data = querystring.stringify({
      j_username: argv.u,
      j_password: argv.p, 
      returnUrl: typeof(_url[1]) === 'undefined' ? '' : _url[1], 
      submit: ''
    });
    var bodyData = JSON.stringify(req.body)
    proxyReq.setHeader('Content-Type', 'application/x-www-form-urlencoded');
    proxyReq.setHeader('Accept', "text/json");
    proxyReq.setHeader('User-Agent', req.headers['user-agent']);
    //proxyReq.setHeader('cookie', req.headers['cookie']);
    proxyReq.setHeader('Content-Length', Buffer.byteLength(post_data));
    proxyReq.method='POST';
    proxyReq.path='/j_spring_security_check';
    proxyReq.write(post_data);
  }
});

// proxy.on('proxyRes', function(proxyReq, req, res, options) {
// });

var server = http.createServer(function(req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  proxy.web(req, res, { target: proxy_target });
});

console.log("Proxy server is listening on port", argv.pp);
console.log("Proxy target is", proxy_target);
server.listen(parseInt(argv.pp));
