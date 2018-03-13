# Lab 06 - Basic Authentication

## Introduction

Objectives:

* Learn how to protect your API using basic authentication.

## Instructions

Take the solution from lab 04 as a starting point and follow the steps below:

1. Add a new BasicAuthentication policy with the following XML contents:

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <BasicAuthentication async="false" continueOnError="false" enabled="true" name="BasicAuthentication">
            <Operation>Decode</Operation>
            <IgnoreUnresolvedVariables>false</IgnoreUnresolvedVariables>
            <User ref="clientId"/>
            <Password ref="clientSecret"/>
            <Source>request.header.Authorization</Source>
        </BasicAuthentication>

3. Add the BasicAuthentication policy as a step of the &lt;Request&gt; element in the proxy endpoint PreFlow after the SpikeArrest policy. Adding this policy there, we have made sure that if a request hits our API proxy with Basic Authentication we extract the username and password in the Authorization header into runtime variables called clientId and clientSecret.

        <PreFlow>
            <Request>
                <Step>
                    <Name>KeyValueMapOperations.ReadConfiguration</Name>
                </Step>
                <Step>
                    <Name>SpikeArrest</Name>
                    <Condition>environment.name = "prod"</Condition>
                </Step>
                <Step>
                    <Name>BasicAuthentication</Name>
                </Step>
                <Step>
                    <Name>VerifyAPIKey</Name>
                </Step>
                <Step>
                    <Name>Quota</Name>
                    <Condition>environment.name = "prod"</Condition>
                </Step>
                <Step>
                    <Name>ResponseCache</Name>
                </Step>
            </Request>
            <Response/>
        </PreFlow>

4. Modify the existing VerifyAPIKey policy so the ref attribute in the &lt;APIKey&gt; element is now the clientId variable. Below how the XML of the policy would look like:

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <VerifyAPIKey async="false" continueOnError="false" enabled="true" name="VerifyAPIKey">
            <APIKey ref="clientId"/>
        </VerifyAPIKey>

5. With this we have verified that the clientId variable value matches the consumer key of a developer app that has a product the grants access to this API proxy. But we have not only done that, the execution of that VerifyAPIKey policy has extracted the consumer key of that developer app in a variable called verifyapikey.VerifyAPIKey.client_secret. We need now to check whether the value of the clientSecret runtime variable matches the value of the consumer secret that was extracted by the VerifyAPIKey policy. If both values do not match, the request should not go through and an error message saying that the request is not authorized should be send back to the client. For that we will need to add the following to steps in the proxy endpoint PreFlow, just after the VerifyAPIKey policy:

        <Step>
            <Name>AssignMessage.Error.Unauthorized</Name>
            <Condition>verifyapikey.VerifyAPIKey.client_secret != clientSecret</Condition>
        </Step>
        <Step>
            <Name>RaiseFault.GoToFaultRules</Name>
            <Condition>flow.error.code != NULL</Condition>
        </Step>

7. Go to the Trace tool, click on "Start Trace Session".

8. Open a terminal, send a request without Authorization header using the command below. Verify that the BasicAuthentication policy has failed and check what the raised fault is on the trace tool. Write it down.

        $ curl -v https://ORGANIZATION-ENVIRONMENT.apigee.net/book/v1/books

6. Send another request with an invalid authorization header and check which fault was raised by the BasicAuthentication policy in this other case.

        $ curl -v -H 'Authorization: invalid' -v https://ORGANIZATION-ENVIRONMENT.apigee.net/book/v1/books

7. Modify the existing "Unauthorized" FaultRule in the proxy endpoint to include the faults that you wrote down. It should look as follows:

            <FaultRule name="Unauthorized">
                <Step>
                    <Name>AssignMessage.Error.Unauthorized</Name>
                </Step>
                <Condition>fault.name = "InvalidApiKey" OR fault.name = "FailedToResolveAPIKey" OR (fault.name = "UnresolvedVariable" AND BasicAuthentication.BasicAuthentication.failed = true) OR fault.name = "InvalidBasicAuthenticationSource"</Condition>
            </FaultRule>

8. Repeat step 6 and 7 to verify that know you get back a 401 HTTP response code back.

8. Using the API Console send a request using Basic Authentication (it can be set using the available option in the top bar) with an invalid password. Make sure you get a 401 HTTP response code back.

9. Repeat the previous step but now supplying a valid password. Make sure that you get a 200 HTTP response code back.





