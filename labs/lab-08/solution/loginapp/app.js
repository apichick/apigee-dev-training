const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const request = require('request-promise');

const CLIENT_ID = 'D5t6vfqOkYizuRVgNZ8O2gcPeQQbz1HG';
const CLIENT_SECRET = 'bHrcg4VDPi3MN8k4';
const BASE_URL = 'https://apigeetraining2018-eval-test.apigee.net/identity/v1';

let accessToken;
let expiryTime;

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const refreshAccessToken = () => {
    if(!accessToken || expiryTime < (new Date()).getTime()) {
        return request.post({
            uri: BASE_URL + '/token',
            auth: {
                user: CLIENT_ID,
                pass: CLIENT_SECRET
            },
            form: {
                grant_type: 'client_credentials'
            },
            json: true
        }).then(result => {
            accessToken = result.access_token;
            expiryTime = (new Date()).getTime() + result.expires_in * 1000 - 120000;
            return accessToken;
        });
    } else {
        return Promise.resolve(accessToken);
    }
}

app.get('/authorize', (req, res) => {
    let body = {}
    body.client_id = req.query.client_id
    if(req.query.redirect_uri) {
        body.redirect_uri = req.query.redirect_uri
    }
    refreshAccessToken().then(accessToken => {
        return request.post({
            uri: BASE_URL + '/validate',
            body: body,
            auth: {
                bearer: accessToken
            },
            json: true
        });
    }).then(result => {
        res.render('login', { title: 'Login', client_id: req.query.client_id, app_name: result.app_name, redirect_uri: req.query.redirect_uri, scope: req.query.scope, state: req.query.state });
    }).catch(error => {
        res.redirect(req.query.redirect_uri + '#error=invalid_client')
    });
});

app.post('/validate', (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;
    if(pass === 'valid') {
        res.render('consent', { title: 'Consent', client_id: req.body.client_id, app_name: req.body.app_name, redirect_uri: req.body.redirect_uri, scope: req.body.scope, state: req.body.state });
    } else {
        res.redirect(req.body.redirect_uri + '#error=invalid_user');
    }   
});

app.post('/consent', (req, res) => {
    if(req.body.submit === 'accept') {
        if(req.body.requestedScopes && !req.body.scope) {
            res.redirect(req.body.redirect_uri + "#error=access_denied");
        } else {
            refreshAccessToken().then(accessToken => {
                let form = {
                    response_type: 'token',
                    client_id: req.body.client_id
                }
                if(req.body.scope) {
                    form.scope = req.body.scope.join(' ');
                } 
                return request.post({
                    uri: BASE_URL + '/implicit',
                    form: form,
                    auth: {
                        bearer: accessToken
                    },
                    json: true
                });
            }).then(result => {
                res.redirect(req.body.redirect_uri + '#access_token=' + result.access_token + '&token_type=' + result.token_type + '&expires_in=' + result.expires_in + '&scope=' + req.body.scope + '&state=' + req.body.state);
            }).catch(error => {
                res.redirect(req.body.redirect_uri + '#error=server_error');
            });
        }
    } else {
        res.redirect(req.body.redirect_uri + '#error=access_denied');
    }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app