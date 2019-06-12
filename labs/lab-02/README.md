# Lab 02 - Advanced Error Handling

## Introduction

The objectives of this lab are listed below:

* Implement the required steps in the API proxy DefaultFaultRule to build the error response and send it back to the client.
* Set up the required FaultRules to catch all the error conditions raised by the  Apigee policies and populate the runtime variables required to build the error response.
* Learn how to raise your own errors in the API proxy.

## Instructions

We will take as starting point the solution of Lab 01.

### Adding a DefaultFaultRule to the API Proxy

* Create a new RaiseFault policy to build the error response sent to the client:

      <RaiseFault name="RaiseFault.JSON">
        <FaultResponse>
          <Set>
            <Payload contentType="application/json">{
                "code":"{flow.error.code}",
                "message":"{flow.error.message}",
                "info":"{flow.error.info}"
            }</Payload>
            <StatusCode>{flow.error.status}</StatusCode>
          </Set>
        </FaultResponse>
        <IgnoreUnresolvedVariables>true</IgnoreUnresolvedVariables>
      </RaiseFault>

    As you can see the error response will require certain runtime variables (flow.error.*) to be populated before it is actually send back to the client.

* Create a new AssignMessage policy to set some default values for the runtime variables.

      <AssignMessage async="false" continueOnError="false" enabled="true" name="AssignMessage.Error.InternalServerError">
        <AssignVariable>
          <Name>flow.error.message</Name>
          <Value>Proxy internal server error</Value>
        </AssignVariable>
        <AssignVariable>
          <Name>flow.error.code</Name>
          <Value>500.01.001</Value>
        </AssignVariable>
        <AssignVariable>
          <Name>flow.error.status</Name>
          <Value>500</Value>
        </AssignVariable>
        <AssignVariable>
          <Name>flow.error.info</Name>
          <Value>http://documentation</Value>
        </AssignVariable>
      </AssignMessage>

* Add the following DefaultFaultRule directy inside the XML root element of ProxyEndpoint and TargetEndpoint:

      <DefaultFaultRule>
          <AlwaysEnforce>true</AlwaysEnforce>
          <Step>
              <Name>AssignMessage.Error.InternalServerError</Name>
              <Condition>flow.error.code = NULL</Condition>
          </Step>
          <Step>
              <Name>RaiseFault.JSON</Name>
          </Step>
      </DefaultFaultRule>

For debugging purpose, you can remove those lines, the error message will be sent clear to your client.

### Catching errors raised by Apigee policies

If we leave things as they are, we will get an 500 Internal Server Error, each time an Apigee policy that has been set with continueOnError="false" raises an error. In order to avoid this, we will have to add FaultRules for the different error conditions that policies might raise.

In our example, we will have to add a new FaultRule in case the API key supplied in the request is missing or invalid. In this fault rule we will be assigning the values of the variables required to build the error response accordingly.

* FaultRule

        <FaultRules>
            <FaultRule name="Unauthorized">
                <Step>
                    <Name>AssignMessage.Error.Unauthorized</Name>
                </Step>
                <Condition>fault.name = "InvalidApiKey" OR fault.name = "FailedToResolveAPIKey"</Condition>
            </FaultRule>
        </FaultRules>

* AssignMessage policy

      <AssignMessage async="false" continueOnError="false" enabled="true" name="AssignMessage.Error.Unauthorized">
        <AssignVariable>
          <Name>flow.error.message</Name>
          <Value>Unauthorized</Value>
        </AssignVariable>
        <AssignVariable>
          <Name>flow.error.code</Name>
          <Value>401.01.001</Value>
        </AssignVariable>
        <AssignVariable>
          <Name>flow.error.status</Name>
          <Value>401</Value>
        </AssignVariable>
        <AssignVariable>
          <Name>flow.error.info</Name>
          <Value>http://documentation</Value>
        </AssignVariable>
      </AssignMessage>

### Raising errors

In this section we will explain how to raise errors ourselves.

#### Validation of incoming request fails

Let's raise a 400 Bad Request HTTP error in case the search term is missing when searching for a book. The steps to follow are below:

* Create an AssignMessage policy to set the variables required when building the error response.

      <AssignMessage async="false" continueOnError="false" enabled="true" name="AssignMessage.Error.MissingSearchTerm">
        <AssignVariable>
          <Name>flow.error.message</Name>
          <Value>Missing search term</Value>
        </AssignVariable>
        <AssignVariable>
          <Name>flow.error.code</Name>
          <Value>400.01.001</Value>
        </AssignVariable>
        <AssignVariable>
          <Name>flow.error.status</Name>
          <Value>400</Value>
        </AssignVariable>
        <AssignVariable>
          <Name>flow.error.info</Name>
          <Value>http://documentation</Value>
        </AssignVariable>
      </AssignMessage>

* Create a new RaiseFault policy that just raises an error.

      <RaiseFault name="RaiseFault.GoToFaultRules"/>

* Modify the existing conditional flow for the book search so it looks as follows:

        <Flow name="searchBooks">
            <Request>
                <Step>
                    <Name>AssignMessage.Error.MissingSearchTerm</Name>
                    <Condition>request.queryparam.q = NULL</Condition>
                </Step>
                <Step>
                    <Name>RaiseFault.GoToFaultRules</Name>
                    <Condition>flow.error.code != NULL</Condition>
                </Step>
            </Request>
            <Condition>request.verb = "GET" AND proxy.pathsuffix MatchesPath "/books/search"</Condition>
        </Flow>

#### Resource not found

Let's raise a 404 Not Found HTTP error in case the client requests an invalid path in our API proxy:

* Create an AssignMessage policy to set the variables required when building the error response

        <AssignMessage async="false" continueOnError="false" enabled="true" name="AssignMessage.Error.ResourceNotFound">
            <AssignVariable>
                <Name>flow.error.message</Name>
                <Value>Resource not found</Value>
            </AssignVariable>
            <AssignVariable>
                <Name>flow.error.code</Name>
                <Value>404.01.001</Value>
            </AssignVariable>
            <AssignVariable>
                <Name>flow.error.status</Name>
                <Value>404</Value>
            </AssignVariable>
            <AssignVariable>
                <Name>flow.error.info</Name>
                <Value>http://documentation</Value>
            </AssignVariable>
        </AssignMessage>

* Add new conditional flow as the last one in the proxy endpoint looking as follows:

        <Flow name="Resource Not Found">
            <Request>
                <Step>
                    <Name>AssignMessage.Error.ResourceNotFound</Name>
                </Step>
                <Step>
                    <Name>RaiseFault.GoToFaultRules</Name>
                </Step>
            </Request>
        </Flow>
