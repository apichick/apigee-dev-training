# Lab 09 - BDD Testing (cucumber-js + apickli)

## Introduction

Objectives:

* Learn how to do automated testing of your API using cucumber-js and apickli

## Pre-requisites

The following software needs to be installed in your machine:

* Node.js (latest LTS version)

NOTE: Windows users, please use PowerShell for the steps that require command line.

## Instructions

We will take as a starting point the solution from lab 02

1. Create a folder called test in your file system

        $ mkdir test

2. Initialize and install the dependencies

        $ npm init -y
        $ npm install --save cucumber apickli cucumber-pretty

3. Create a sub-folder named features inside the test folder

        $ mkdir test/features

4. Add a file named book-api-v1.feature inside the features folder that you just created with the following contents

        Feature: Book API (V1) Tests

        Scenario: Get Books - Success

            When I GET /books?apikey=`apikey`
            Then response code should be 200
            And response body should be valid json
            And response body path $.[0].id should be (.+)

        Scenario: Get Books - Unauthorized

            When I GET /books
            Then response code should be 401
            And response body should be valid json
            And response body path $.code should be 401.01.001
            And response body path $.message should be Unauthorized 
            And response body path $.info should be (.+)

        Scenario: Search Books - Success

            When I GET /books/search?apikey=`apikey`&q=War
            Then response code should be 200
            And response body should be valid json
            And response body path $.[0].title should be ^(.*[wW][Aa][rR].*)$

        Scenario: Search Books - Unauthorized

            When I GET /books/search?q=War
            Then response code should be 401
            And response body should be valid json
            And response body path $.code should be 401.01.001
            And response body path $.message should be Unauthorized 
            And response body path $.info should be (.+)

        Scenario: Search Books - Missing Search Term

            When I GET /books/search?apikey=`apikey`
            Then response code should be 400
            And response body should be valid json
            And response body path $.code should be 400.01.001
            And response body path $.message should be Missing search term 
            And response body path $.info should be (.+)

        Scenario: Get Book By Id - Success

            When I GET /books/121b4bb3-c971-4080-b230-571148b71969?apikey=`apikey`
            Then response code should be 200
            And response body should be valid json
            And response body path $.id should be 121b4bb3-c971-4080-b230-571148b71969

        Scenario: Get Book By Id - Unauthorized

            When I GET /books/121b4bb3-c971-4080-b230-571148b71969
            Then response code should be 401
            And response body should be valid json
            And response body path $.code should be 401.01.001
            And response body path $.message should be Unauthorized 
            And response body path $.info should be (.+)

        Scenario: Resource Not Found

            When I GET /other?apikey=`apikey`
            Then response code should be 404
            And response body should be valid json
            And response body path $.code should be 404.01.001
            And response body path $.message should be Resource not found 
            And response body path $.info should be (.+)

5. Create a sub-folder called step_definitions inside test/features

        $ mkdir test/features/step_definitions

6. Create a file called apickli-gherkin.js with the following contents inside step_definitions

        module.exports = require('apickli/apickli-gherkin');

7. Create a file called init.js with the contents provided below inside step_definitions

        const apickli = require('apickli');
        const {
            Before,
            setDefaultTimeout
        } = require('cucumber');

        setDefaultTimeout(10 * 1000);

        Before(function () {
            this.apickli = new apickli.Apickli(this.parameters.scheme, this.parameters.domain);
            this.apickli.storeValueInScenarioScope('apikey', this.parameters.apikey);
        });

8. Run the following command inside the test folder

        $ node ./node_modules/cucumber/bin/cucumber-js --world-parameters '{ "scheme": "https", "domain": "ORGANIZATION-ENVIRONMENT.apigee.net/book/v1", "apikey": "APIKEY"}' --format ./node_modules/cucumber-pretty

    Replace ORGANIZATION, ENVIRONMENT and APIKEY with the suitable values.
