# Lab 04 - Traffic Management

## Introduction

Objectives:

* Learn how to protect your API proxy backend from traffic spikes using the SpikeArrest policy.

* Learn how to restrict the amount of requests a certain client can make over a period of time using the Quota policy.

## Instructions

We will take the solution available for lab 03 as starting point and follow the steps available below.

### SpikeArrest

1. Add a new parameter in the book-api-v1-configuration key-value map named spikeArrestRate and set the value to 5pm.

2. Modify the KeyValueMapOperations.ReadConfiguration policy so the newly added parameter in the key-value map is also read.

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <KeyValueMapOperations async="false" continueOnError="false" enabled="true" name="KeyValueMapOperations.ReadConfiguration" mapIdentifier="book-api-v1-configuration">
            <Scope>environment</Scope>
            <ExpiryTimeInSecs>300</ExpiryTimeInSecs>
            <Get assignTo="config.cacheEntryExpiry">
                <Key>
                    <Parameter>cacheEntryExpiry</Parameter>
                </Key>
            </Get>
            <Get assignTo="config.spikeArrestRate">
                <Key>
                    <Parameter>spikeArrestRate</Parameter>
                </Key>
            </Get>
        </KeyValueMapOperations>

1. Add a new SpikeArrest policy with the following XML content:

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <SpikeArrest async="false" continueOnError="false" enabled="true" name="SpikeArrest">
            <Rate ref="config.spikeArrestRate">10pm</Rate>
            <UseEffectiveCount>true</UseEffectiveCount>
        </SpikeArrest>

    NOTE: For the rate we reference the value read from the key-value map. In addition to that, we set a default hardcoded value that applies for cases when the key-valuemap entry has not been defined.

2. Add the SpikeArrest policy to the &lt;Request&gt; element in the proxy endpoint PreFlow after the KeyValueMapOperations.ReadConfiguration policy.

        <PreFlow>
            <Request>
                <Step>
                    <Name>KeyValueMapOperations.ReadConfiguration</Name>
                </Step>
                <Step>
                    <Name>SpikeArrest</Name>
                </Step>
                <Step>
                    <Name>VerifyAPIKey</Name>
                </Step>
                <Step>
                    <Name>AssignMessage.RemoveAPIKey</Name>
                </Step>
                <Step>
                    <Name>ResponseCache</Name>
                </Step>
            </Request>
            <Response/>
        </PreFlow>

3. Go to the trace tool and start to send requests non-stop to your API proxy. Eventually you will see that the SpikeArrest policy raises a fault. Write down the name of the fault raised.

4. We have to add proper fault handling for the fault raised by the SpikeArrest policy. Create a new AssignMessage policy with the following XML contents:

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <AssignMessage async="false" continueOnError="false" enabled="true" name="AssignMessage.Error.SpikeArrestViolation">
            <AssignVariable>
                <Name>flow.error.message</Name>
                <Value>Too many requests</Value>
            </AssignVariable>
            <AssignVariable>
                <Name>flow.error.code</Name>
                <Value>429.01.001</Value>
            </AssignVariable>
            <AssignVariable>
                <Name>flow.error.status</Name>
                <Value>429</Value>
            </AssignVariable>
            <AssignVariable>
                <Name>flow.error.info</Name>
                <Value>http://documentation</Value>
            </AssignVariable>
        </AssignMessage>

5. Add a new FaultRule to handle the fault raised by the SpikeArrest policy:

        <FaultRule name="Spike Arrest Violation">
            <Step>
                <Name>AssignMessage.Error.SpikeArrestViolation</Name>
            </Step>
            <Condition>fault.name = "SpikeArrestViolation"</Condition>
        </FaultRule>

6. Generally we will only want to use this protection against traffic spikes in production, so we will add a condition to the step with the SpikeArrest policy in the proxy endpoint PreFlow so it looks like this:

        <Step>
            <Name>SpikeArrest</Name>
            <Condition>environment.name = "prod"</Condition>
        </Step>

### Quota

1. Fist, go to **Publish > API Products**, edit the product that you are using and set up the quota there. For demonstration purposes, so we can see the quota being violated, we will only allow 4 requests per minute. Make sure that the test environment is checked for that product.

2. Then add a new Quota policy with the following XML content:

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Quota async="false" continueOnError="false" enabled="true" name="Quota">
            <Allow count="2000" countRef="verifyapikey.VerifyAPIKey.apiproduct.developer.quota.limit"/>
            <Interval ref="verifyapikey.VerifyAPIKey.apiproduct.developer.quota.interval">1</Interval>
            <TimeUnit ref="verifyapikey.VerifyAPIKey.apiproduct.developer.quota.timeunit">month</TimeUnit>
            <Identifier ref="verifyapikey.VerifyAPIKey.client_id" />
            <Distributed>true</Distributed>
            <Synchronous>true</Synchronous>
        </Quota>

    When the VerifyAPIKey policy runs all the quota settings that we made in the product are extracted in runtime variables. We are using those variables in the policy.

3. Add the Quota policy as a new step in the &lt;Request&gt; element in the proxy endpoint Preflow, just after the AssignMessage.RemoveAPIKey policy.

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
                    <Name>VerifyAPIKey</Name>
                </Step>
                <Step>
                    <Name>AssignMessage.RemoveAPIKey</Name>
                </Step>
                <Step>
                    <Name>Quota</Name>
                </Step>
                <Step>
                    <Name>ResponseCache</Name>
                </Step>
            </Request>
            <Response/>
        </PreFlow>

4. Go to the trace tool and click on "Start Trace Session". Open a new terminal and start sending requests using the command below. Eventually you will see that the Quota policy raises a fault. Write down the name of the fault raised.

        $ curl -v -u https://ORGANIZATION-ENVIRONMENT.apigee.net/v1/books/book?apikey=APIKEY
    
5. We have to add proper fault handling for the fault raised by the SpikeArrest policy. Create a new AssignMessage policy with the following XML contents:

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <AssignMessage async="false" continueOnError="false" enabled="true" name="AssignMessage.Error.QuotaViolation">
            <AssignVariable>
                <Name>flow.error.message</Name>
                <Value>Too many requests</Value>
            </AssignVariable>
            <AssignVariable>
                <Name>flow.error.code</Name>
                <Value>429.01.002</Value>
            </AssignVariable>
            <AssignVariable>
                <Name>flow.error.status</Name>
                <Value>429</Value>
            </AssignVariable>
            <AssignVariable>
                <Name>flow.error.info</Name>
                <Value>http://documentation</Value>
            </AssignVariable>
        </AssignMessage>

5. Add a new FaultRule to handle the fault raised by the SpikeArrest policy:

        <FaultRule name="Quota Violation">
            <Step>
                <Name>AssignMessage.Error.QuotaViolation</Name>
            </Step>
            <Condition>fault.name = "QuotaViolation"</Condition>
        </FaultRule>

6. Add a condition to the Quota step so it is only enforced in production

        <Step>
            <Name>Quota</Name>
            <Condition>environment.name = "prod"</Condition>
        </Step>

