# Lab 08 - OAuth V2 - Implicit Grant

## Introduction

Objectives:

* Learn how to implement implicit grant in Apigee

## Instructions

For this lab we will use the book-api-v1 API proxy that we developed in lab 07, but a modified version of the identity-api-v1 API proxy that is available in the solution folder.

1. Download a new identity-api-v1 API proxy bundle from [here](https://github.com/apichick/apigee-dev-training/raw/master/labs/lab-08/solution/identity-api-v1.zip). 

2. Create a new API proxy from this bundle in your organization and deploy it to the test environment. You might need to remove the identity-api-v1 API proxy created in the previous lab.

3. Create a new API product called LoginAPIProduct that includes the identity-api-v1 proxy

4. Create a new developer.

5. Create a new developer app called LoginApp for the developer and API product created in the previous step.

6. Download the loginapp archive from [here](https://github.com/apichick/apigee-dev-training/raw/master/labs/lab-08/solution/loginapp.zip) and extract it.

7. Install the Node.js dependencies running the following command:

        $ npm install

8. Edit the file app.js inside the loginapp folder a set the CLIENT_ID and CLIENT_SECRET variables to the consumer key and consumer secret of the developer app created in step 5. Make sure that you also replace the string apigeetraining2018-eval with the name or your Apigee organization.

9. Start the loginapp Node.js application using the following command inside the loginapp folder.

        $ ./bin/www

10. Open the browser and make a request to the following URL:

    http://localhost:3000/authorize?response_type=code&client_id=CLIENT_ID&redirect_uri=http://localhost

    NOTE: CLIENT_ID is the consumer key of the BookApp developer app.

11. You will be redirected to a login page. As user enter anything and as password enter the string "valid" and then click Sign In.

12. Once you have signed in the consent page will be displayed. Click on "Accept".

13. Check that you have been redirected to

    http://localhost#access_token=ACCESS_TOKEN&token_type=bearer&expires_in=EXPIRES_IN
