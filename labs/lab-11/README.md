# Lab 11 - Target Mocking (Node.js + apimocker)
## Introduction

The main objective of this lab is to learn how to a quick mock for your target backend and deploy it in Apigee as an API proxy.

## Pre-requisites

The following software needs to be installed in your machine:

1. Node.js
2. JDK 1.8 or higher
3. Maven

## Instructions

1. Create the following folder structure

        mock-api-v1
            |-- apiproxy
                |-- proxies
                |-- targets
                |-- resources
                        |-- node

2. Create the API proxy descriptor mock-api.xml inside mock-api-v1/apiproxy directory with the following content:

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <APIProxy name="mock-api-v1">
            <Description>Mock API</Description>
        </APIProxy>

4. Create the ProxyEndpoint descriptor default.xml inside mock-api-v1/apiproxy/proxies directory with the content below:

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <ProxyEndpoint name="default">
            <HTTPProxyConnection>
                <BasePath>/mock/v1</BasePath>
                <VirtualHost>secure</VirtualHost>
            </HTTPProxyConnection>
            <RouteRule name="default">
                <TargetEndpoint>default</TargetEndpoint>
            </RouteRule>
        </ProxyEndpoint>

5. Create the descriptor default.xml for the TargetEndpoint that we were referencing in the ProxyEndpoint descriptor. In our case the TargetEndpoint will be a Node.js application. Add an XML file with the following contents to the mock-api/v1/apiproxy/targets directory.

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <TargetEndpoint name="default">
            <ScriptTarget>
                <ResourceURL>node://app.js</ResourceURL>
            </ScriptTarget>
        </TargetEndpoint>

6. The next step will be to initialize our Node.js app inside mock-api-v1/apiproxy/resources/node directory and install the required node dependencies.

        $ npm init -y
        $ npm install --save apimocker@0.5.1

7. Create a folder called mocks inside mock-api-v1/apiproxy/resources/node. That folder will contain the templates for your mock responses

8. Create a file called book.xml inside mock-api-v1/apiproxy/resources/node/mocks with the following content.

        <?xml version="1.0" encoding="UTF-8"?>
        <book>
            <id>@bookId</id>
            <price>$18.2</price>
            <publisher>Penguin</publisher>
            <title>Northanger Abbey</title>
            <year>1814</year>
        </book>

9. Create a configuration file for apimocker named config.json inside mock-api/apiproxy/resources/node with the following contents:

        {
            "mockDirectory": "./mocks",
            "quiet": false,
            "port": "8080",
            "logRequestHeaders": false,
            "webServices": {
                "books/:bookId": {
                    "verbs": ["get"],
                    "enableTemplate": true,
                    "mockFile": "book.xml",
                    "contentType": "application/xml"
                }
            }
        }

9. Create a file called app.js inside mock-api-v1/apiproxy/resources/node/app.js with the following contents:

        var ApiMocker = require('apimocker');
                
        var options = {};

        var apiMocker = ApiMocker.createServer(options)
            .setConfigFile('config.json')
            .start();

    This will be the entry point of your app.

10. Install trireme

        $ npm install -g trireme

    Trireme in Node.js runtime in Apigee

11. Inside the mock-api-v1/apiproxy/resources/node/ folder run the following command

        $ trireme app.js

12. Make a request to see that it works

        $ curl -v http://localhost:8080/books/121b4bb3-c971-4080-b230-571148b71969

13. Add the pom.xml file available [here](solution/mock-api-v1/pom.xml) inside the mock-api-vi folder.

14. Deploy using maven with the following command

        $ mvn install -Denv=test -Dorg=ORGANIZATION

16. Check that when you make a request to the mock API proxy it succeeds:

        $ curl -v https://ORGANIZATION-ENVIRONMENT.apigee.net/mock/v1/books/121b4bb3-c971-4080-b230-571148b71969
