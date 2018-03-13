# Lab 7 - OAuth V2 - Client Credentials Grant

## Introduction

Objectives:

* Learn how to protect your API using OAuth V2 client credentials grant

## Instructions

### Generate Access Token

1. Create a new "No Target" API Proxy. Here are the proxy details:

        Name: identity-api-v1
        Base path: /identity/v1
        Description: Identity API v1
        Security: Pass through (none)
        Virtual host: secure
        Environment: test

3. Once the proxy is deployed go to the **Develop** tab and add a new conditional flow in the proxy endpoint for HTTP verb "POST" and path "/token"

3. Create a new OAuthV2 policy with the following XML contents:

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <OAuthV2 async="false" continueOnError="false" enabled="true" name="OAuthV2.GenerateAccessToken">
            <DisplayName>OAuthV2.GenerateAccessToken</DisplayName>
            <ExternalAuthorization>false</ExternalAuthorization>
            <Operation>GenerateAccessToken</Operation>
            <SupportedGrantTypes>
                <GrantType>client_credentials</GrantType>
            </SupportedGrantTypes>
            <GenerateResponse enabled="true"/>
            <Tokens/>
        </OAuthV2>

4. Add the policy in the &lt;Response&gt; element of the contional flow that was added previously to the proxy endpoint.

5. Add the identity-api-v1 API proxy to the BookAPIProduct API product included in your developer app.

6. Get an access token using the following request

        curl -v -u CONSUMER_KEY:CONSUMER_SECRET -d "grant_type=client_credentials" https://ORGANIZATION-ENVIRONMENT.apigee.net/identity/v1/token

7. Optional: Add proper error handling following the approach learnt in lab 1.02. Some of the fault to handle will be: What if the send us invalid client credentials?

### Verify Access Token

We will start with the solution for book-api-v1 API proxy of lab 02. We will modify the proxy so instead of API key security we will use OAuth V2 for API security.

1. Create a new OAuthV2 policy with the following XML contents:

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <OAuthV2 async="false" continueOnError="false" enabled="true" name="OAuthV2.VerifyAccessToken">
            <Operation>VerifyAccessToken</Operation>
        </OAuthV2>

2. Replace the following steps from the API proxy end

        <Step>
            <Name>VerifyAPIKey</Name>
        </Step>

    with

        <Step>
            <Name>OAuthV2.VerifyAccessToken</Name>
        </Step>

3. Get an access token from the identity-api-v1 proxy as show in the step 6 of the previous section.

4. Make a call to get the list of books using the access token that you go in the previous step. You should be getting a 200 OK response.

        curl -v -k -H "Authorization: Bearer ACCESS_TOKEN" https://ORGANIZATION-ENVIRONMENT.apigee.net/book/v1/books

5. Add proper error handling in case the incoming request does not have provide an access token or the access token is invalid. We should modify the existing "Unauthorized" FaultRule so it looks like this:

        <FaultRule name="Unauthorized">
            <Step>
                <Name>AssignMessage.Error.Unauthorized</Name>
            </Step>
            <Condition>fault.name = "InvalidAccessToken" OR fault.name = "invalid_access_token"</Condition>
        </FaultRule>
