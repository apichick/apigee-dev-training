# Lab 12 - Edge Microgateway

## Introduction

The main objectives of this lab are:

* Become familiar with Edge Microgateway installation and configuration.
* Implement a custom plugin providing the same functionality as the API proxy developed in Lab 01. This time the target backend will be running on the trainee’s machine.

## Instructions

### Installing and Running the Target Server

1. Get the sources of the target server app, available [here](https://github.com/apichick/apigee-dev-training/raw/master/labs/lab-12/solution/library-api-v1.zip) and place them in a directory in your computer.

2. Once you have them locally, install the required dependencies:

        $ npm install

3. Run the app: 

        $ node app.js

4. Verify that is running properly making a request:

        $ curl -v http://localhost:8080/library/v1/books

### Setting up Microgateway

1. Install the latest version of Edge Microgateway with npm as follows:

        $ npm install -g edgemicro

2. Initialize Edge Microgateway using the command below

        $ edgemicro init

    A subdirectory .edgemicro should have been created in your user's home directory with a file named default.yaml in it.

3. Configure Edge Microgateway for your organization and environment running the following command:

        $ edgemicro configure -o ORGANIZATION -e ENVIRONMENT -u APIGEE-USERNAME

    When running that command you will be prompted for your Apigee password.

    Make sure you copy the key and the secret displayed once the command is run, because you will need them later.

    A new configuration file called ORGANIZATION-ENVIRONMENT-config.yaml should have been created inside the .edgemicro subdirectory in your home directory. Double-check that it is available in that location.

    After running this command a new API proxy called edgemicro-auth should have been created in your organization. Log in to the Apigee Management UI and verify that it exists.

4. Verify that Edge Microgateway has been correctly set up with the command below:

    $ edgemicro verify -o ORGANIZATION -e ENVIRONMENT -k KEY -s SECRET

5. Create a new API proxy using Apigee Management UI in your organization as follows:

    * Proxy type: reverse proxy
    * Name: edgemicro_book-api-v1
    * Base path: /book/v1
    * Target URL: http://localhost:8080/library/v1
    * Security: Pass through (none)

6. Create a new API product including both proxies: edgemicro-auth and edgemicro_book-api-v1.

7. Create a developer.

8. Create a developer app including the API product that was just created.

9. Start Edge Microgateway. You will need the key and the secret that were written to the standard output .

        $ edgemicro start -o ORGANIZATION -e ENVIRONMENT -k KEY -s SECRET

    By default the edge microgateway runs on port 8000 and the oauth plugin is enabled. So if you go now and make a request to http://localhost:8000/book/v1/books you should be getting a 401.

10. In order to get an access token, you can do any of the following things provided that you go the credentials of your developer app:

        $ edgemicro token get -o ORGANIZATION -e ENVIRONMENT -i CONSUMER_KEY -s CONSUMER_SECRET

    Alternatively you can run the following command

        curl -v -X POST "https://ORGANIZATION-ENVIRONMENT.apigee.net/edgemicro-auth/token" -d '{ "client_id": "CONSUMER_KEY", "client_secret": "CONSUMER_SECRET", "grant_type": "client_credentials" }' -H "Content-Type: application/json"

11. Once you have an access token, you can make the request as follows:

        curl -v -H'Authorization: Bearer ACCESS_TOKEN' http://localhost:8000/book/v1/books

    This time you should get a 200 OK with an XML payload containing a lit of books.

### Developing and Using a Custom Microgateway Plugin

The next thing for us to do to complete this lab will be to create a plugin that will be transforming the XML response sent back by the target backend into JSON. Please follow the steps included below:

1. Create a directory named plugins. We will place there our custom plugins for Edge Microgateway.

        $ mkdir plugins

1. Create a directory called book-api-v1 inside the plugins directory. 

        $ mkdir book-api-v1

2. Initialize your plugin.

        $ npm init -y

3. Install the required dependencies.

        $ npm install --save debug xml2js

4. Create a file named index.js and paste the following contents in it:

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

5. Add the the following lines in the plugins section in the Edge Microgateway configuration file that was created for your organization and environment inside the .edgemicro subdirectory in your home directory.

        plugins:
            sequence:
            - oauth
            - book-api-v1
            - accumulate-response

    The accumulate-response plugin is available out of the box and it is used to ensure that we receive the complete response payload in the onend_response handler.

6. Start microgateway supplying the absolute path of the plugins folder as a command line option:

        $ edgemicro start -o ORGANIZATION -e ENVIRNOMENT -k KEY -s SECRET -d PLUGINS_DIRECTORY

7. Make a request a check that the payload returned in JSON.

        $ curl -v -H'Authorization: Bearer ACCESS_TOKEN' http://localhost:8000/book/v1/books
