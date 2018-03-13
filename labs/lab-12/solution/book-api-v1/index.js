'use strict';
var debug = require('debug');
var parser = require('xml2js').parseString;

module.exports.init = function (config, logger, stats) {
    return {
        onend_response: function (req, res, data, next) {
            var baseUrl = res.proxy.parsedUrl.pathname;
            var proxyBasepath = res.proxy.base_path;
            var proxyPathsuffix = req.reqUrl.pathname.replace(proxyBasepath, '');
            if (proxyBasepath === '/book/v1') {
                if (new RegExp("/books(\/.+)*").test(proxyPathsuffix)) {
                    parser(data.toString(), function (err, result) {
                        next(null, JSON.stringify(result));
                    });
                    return;
                }
            }
            next();
        }
    };
}