# Lab 01 - Basic API Proxy Development, Deployment and Testing

## Introduction

This is the first lab of the Apigee Developer Training. The main objectives of this lab are:

* Learn how to import an OpenAPI specification into your organization.
* Learn how to create a pass-through API proxy from an existing API specification and deploy it to an environment in your organization.
* Start using the Edge Trace tool to debug your API proxy.
* Become familiar with the Edge out-of-the-box policies.
* Learn how to protect your API using API key.
* Learn how to use a REST client (Postman, curl, httpie) to test your API.

## Create and Deploy a Pass-through Proxy from an OpenAPI Spec

1. Log in to Apigee Edge Enterprise [https://login.apigee.com/login](https://login.apigee.com/login) using your email and password.

    ![Login](images/login.png)

2. Once you are successfully logged in, click **Develop > Specs** on the left menu and save the Book API (v1) OpenAPI specification available [here](https://raw.githubusercontent.com/apichick/apigee-dev-training-labs/master/labs/lab-1.01/specs/book-api-v1-spec.json) to your computer and edit it to set the host to APIGEE_ORGANIZATION-APIGEE_ENVIRONMENT.apigee.net. Then import the specification from the file system.

    ![Import specification](images/import-spec.png)

3. Once the API spec has been imported, we will go an create a pass-through API proxy from it. Click **Develop > API Proxies** on the left menu and press the **+ Proxy** button to create a new API Proxy.

    ![Create API proxy](images/create-api-proxy.png)

4. Make sure that the option **Reverse Proxy** is checked on the **Type** screen. Click on **Use OpenAPI**, select the API spec that we just imported in the previous step and continue to the next screen.

    ![Select API proxy type](images/select-api-proxy-type.png)

5. Enter the proxy details (name, base path, target URL and description) on the **Details** screen. The url is https://apigee-dev-training.appspot.com/library/v1. Once you are ready jump to the next screen.

    ![Enter API proxy details](images/enter-api-proxy-details.png)

6. On the **Flows** section select for which of the paths available in the OpenAPI specification you would like to create a conditional flow and continue.

    ![Select API proxy flows](images/select-api-proxy-flows.png)

7. Check **Pass through (none)** on the **Security** and  screen and continue.

    ![Select API proxy security](images/select-api-proxy-security.png)

8. We only want our API to be accessible via HTTPS, so untick default on the **Virtual Hosts** screen and continue. 

    ![Select API proxy virtual hosts](images/select-api-proxy-virtual-hosts.png)

9. Select the environment to which the proxy will be deployed, **test** in our case, on the **Build** screen, click on **Build and Deploy** and wait until the deployment is complete.

    ![Select API proxy environments](images/select-api-proxy-environments.png)

10. Click on **View book-api-v1 proxy in the editor**.

    ![Deploy API proxy](images/deploy-api-proxy.png)

11. Make sure that the proxy is correctly deployed in the selected environment. 

    ![Display API proxy overview](images/display-api-proxy-overview.png)

11. Then click on the **TRACE** tab. Once there, verify that the URL in the address bar is https://&lt;APIGEE-ORGANIZATION&gt;-test.apigee.net/book/v1/books and click on the **Send** button. Check the request that was sent to the target and the response received. 

    ![Trace API proxy](images/trace-api-proxy.png)

12. Finally change to the **DEVELOP** tab, where we will be doing all the implementation of our API proxy.

    ![Develop API proxy](images/develop-api-proxy.png)

## Mediation: XML to JSON

The target server is returning an XML payload. We would like the clients of our API
to get the clean JSON payload defined in the OpenAPI specification. In order to achieve this, we will be using an [XMLToJSON](https://docs.apigee.com/api-services/reference/xml-json-policy) policy and a [Javascript](https://docs.apigee.com/api-services/reference/javascript-policy) policy. Follow the steps below:

1. Change to the **DEVELOP** tab. On the left side of the screen, click on the **+** button available to the right of **Policies** to add a new XMLToJSON policy. 

    ![Add XMLToJSON policy](images/add-XMLToJSON-policy.png)

2. Make sure that the XMLToJSON policy is configured as follows in the XML code editor:

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <XMLToJSON async="false" continueOnError="false" enabled="true" name="XMLToJSON">
            <Options>
                <RecognizeNumber>false</RecognizeNumber>
            </Options>
            <OutputVariable>response</OutputVariable>
            <Source>response</Source>
        </XMLToJSON>

3. On the right side of the screen click on **PreFlow** inside the target endpoint called **default**. 

    ![Select flow](images/select-flow.png)

4. Then, select the XMLToJSON policy and drag it so it appears as a new step in response of the flow selected in the previous step

    ![Add XMLToJSON policy to flow](images/add-XMLToJSON-policy-to-flow.png)

5. Change to the **TRACE** tab, start a new trace session and send a new request to https://&lt;APIGEE-ORGANIZATION&gt;-test.apigee.net/book/v1/books. On the **Transaction Map** click on the icon of the XMLToJSON policy so you can inspect what the response content it once the XML to JSON transformation has been performed.

    ![Show policy in trace](images/show-policy-in-trace.png)

6. The XML payload received from the target server is converted into JSON, but it is not in the exact format specified by our API specification yet. We will use a Javascript policy to perform the required adjustments.

    ![Add XMLToJSON policy](images/add-Javascript-policy.png)

7. Find below the contents of the Javascript resource file transformJSON.js. You only need to click transformJSON.js under ***Scripts* on the right hand side to update the contents of script.

        var pathsuffix = context.getVariable('proxy.pathsuffix');
        var payload = JSON.parse(context.getVariable('response.content'));
        if(new RegExp('^/books(/search)*$').test(pathsuffix)) {
            print(Array.isArray(payload.books.book));
            if(Array.isArray(payload.books.book)) {
                payload = payload.books.book;        
            } else {
                payload = [ payload.books.book ];
            }    
        } else if(new RegExp('^/books/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$').test(pathsuffix)) {
            payload = payload.book;
        } else {
            payload = '';
        }
        context.setVariable('response.content', JSON.stringify(payload));     

    ![Update script contents](images/update-script-contents.png)

4. Finally, add the Javascript policy to the &lt;Response&gt; element of the PreFlow in the TargetEndpoint, just after the XMLToJSON policy.  

    ![Add Javascript policy to flow](images/add-Javascript-policy-to-flow.png)

## Caching

To improve the performance of our API we are going to introduce response caching and use the [ResponseCache]((https://docs.apigee.com/api-services/reference/response-cache-policy) policy for that purpose.

1. Click **Admin > Environments** on the left menu and make sure that you are have the **Caches** tab selected. Click **Edit** on the right side, then click **+ Cache**, enter the name (book-api-v1-response-cache) and save.

    ![Add cache](images/add-cache.png)

2. Add a ResponseCache policy. As cache key we are going to use the value of the **message.uri** runtime variable. The message.uri variable contains the complete URI path including the querystring parameters. See below how the XML of the policy should look like:

    ![Add ResponseCache policy](images/add-ResponseCache-policy.png)

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <ResponseCache async="false" continueOnError="false" enabled="true" name="ResponseCache">
            <CacheKey>
                <KeyFragment ref="message.uri" />
            </CacheKey>
            <CacheResource>book-api-v1-response-cache</CacheResource>
            <ExpirySettings>
                <TimeoutInSec>600</TimeoutInSec>
            </ExpirySettings>
        </ResponseCache>

2. The ResponseCache policy has to be always added in the request and the response flows to work properly. Drag the policy and add it to the &lt;Request&gt; element of the PreFlow in the ProxyEndpoint and to the &lt;Response&gt; element of the PreFlow in the TargetEndpoint. We want to cache the response once it has been transformed from XML to JSON, so we will add it just after Javascript policy.

    ![Add ResponseCache policy to flow (Request)](images/add-ResponseCache-policy-to-flow-request.png)

    ![Add ResponseCache policy to flow (Response)](images/add-ResponseCache-policy-to-flow-response.png)

Check if the ResponseCache policy is working using the Trace tool. There you will be able to determine wether the cache was hit or not, whenever you make a new request. You might want to check what happens when the cache is cleared too. In order to clear it, go back the Caches tab **Admin > Environments** and click on the **Clear** button available to the left of the row where your cache is listed.

## Set up an Environment Key-value Map for API proxy configuration

It is a good practice to always have an environment key-value map per API proxy containing configurable parameters that might need to be changed at runtime. We are going to create a key-value map named book-api-v1-configuration and have the expiry time settings of the cached entries in the response cache as a configurable parameter. Please, follow the steps below to create the map:

1. On the **Key Value Maps** tab of the **Admin > Environments** section, click **Edit**.

2. Click on the **+Key Value Map** button. Enter the name of the key-value map (book-api-v1-configuration). We will use a non-encrypted one for this proxy, since we are not storing any sensitive information.

    ![Add key-value map](images/add-keyvaluemap.png)

3. Add a new entry named cacheEntryExpiry and set it to a value of 3600. 

    ![Add key-value map entry](images/add-keyvaluemap-entry.png)

Once the key-value map is created and populated with the entries, we need to add the KeyValueMapOperations policy that will read the values of the entries to the API proxy: 

1. Go back to the **DEVELOP** tab and create a new KeyValueMapOperations policy with the configuration provided below:

    ![Add KeyValueMapOperations policy](images/add-KeyValueMapOperations-policy.png)

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <KeyValueMapOperations async="false" continueOnError="false" enabled="true" name="KeyValueMapOperations.ReadConfiguration" mapIdentifier="book-api-v1-configuration">
            <Scope>environment</Scope>
            <ExpiryTimeInSecs>300</ExpiryTimeInSecs>
            <Get assignTo="config.cacheEntryExpiry">
                <Key>
                    <Parameter>cacheEntryExpiry</Parameter>
                </Key>
            </Get>
        </KeyValueMapOperations>

2. Drag the policy that you just created and add it as first step to the &lt;Request&gt; element of the PreFlow in the ProxyEndpoint. 

    ![Add KeyValueMapOperations policy to flow](images/add-KeyValueMapOperations-policy-to-flow.png)

3. Edit the ResponseCache policy so the configuration.cacheEntryExpiry variable is used in the cache entry expiry settings:

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <ResponseCache async="false" continueOnError="false" enabled="true" name="ResponseCache">
            <CacheKey>
                <KeyFragment ref="message.uri" />
            </CacheKey>
            <CacheResource>book-api-v1-response-cache</CacheResource>
            <ExpirySettings>
                <TimeoutInSec ref="config.cacheKeyExpiry">600</TimeoutInSec>
            </ExpirySettings>
            <ExcludeErrorResponse>true</ExcludeErrorResponse>
        </ResponseCache>

Check that everything is still working properly. 

## Basic API Security using and API Key.

Finally, we are going to protect our API usign an API key. The API key will have to be provided using a querystring parameter named apikey.

The first thing to do is to click on **Publish** on the left menu and follow the steps below:

1. Create an API product named BookAPIProduct that includes the book-api-v1 proxy and is available in the test environment. Set the callback URL to http://localhost

    ![Add API product](images/add-apiproduct.png)

2. Create a new Developer.

    ![Add developer](images/add-developer.png)

3. Create a Developer app named BookApp for the developer created in the previous step, assign the BookAPIProduct to it and the click on the **Save** button. Go back inside the API product and you will see that a set of client credentials have been created. The consumer key is the value that you will have to set the apikey querystring parameter to.

    ![Add developer app](images/add-developer-app.png)

Once all this is done, we need to add a [VerifyAPIKey](https://docs.apigee.com/api-services/reference/verify-api-key-policy) policy to the API proxy: 

1. Go back to the **DEVELOP** tab and create a new [VerifyAPI](https://docs.apigee.com/api-platform/reference/policies/verify-api-key-policy) key policy as shown below:

    ![Add VerifyAPIKey policy](images/add-VerifyAPIKey-policy.png)

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <VerifyAPIKey async="false" continueOnError="false" enabled="true" name="VerifyAPIKey">
            <APIKey ref="request.queryparam.apikey"/>
        </VerifyAPIKey>

2. Add it as a second step to the &lt;Request&gt; element of the proxy PreFlow in the ProxyEndpoint, just after the KeyValueMapOperations.ReadConfiguration policy.

    ![Add VerifyAPIKey policy to flow](images/add-VerifyAPIKey-policy-to-flow.png)

3. Create an [AssignMessage](https://docs.apigee.com/api-platform/reference/policies/assign-message-policy) policy to remove the apikey querystring parameter so we do not send it to the target (By default, Edge copies the querystring parameters of the incoming request from the client for the outgoing request to the target).

    ![Add AssignMessage policy](images/add-AssignMessage-policy.png)

        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <AssignMessage async="false" continueOnError="false" enabled="true" name="AssignMessage.RemoveAPIKey">
            <AssignTo createNew="false" transport="http" type="request"/>
            <Remove>
                <QueryParams>
                    <QueryParam name="apikey"/>
                </QueryParams>
            </Remove>
        </AssignMessage>

4. Add the policy just created to the &lt;Request&gt; element of the proxy PreFlow in the ProxyEndpoint after the VerifyAPIKey policy.

    ![Add AssignMessage policy to flow](images/add-VerifyAPIKey-policy-to-flow.png)

Use the Trace tool to see if everything works fine when submitting requests with a valid consumer key as apikey querystring parameter. Check what happens when no key or an invalid key is used.

## Creating a Developer Portal

1. Click **Publish > Portals** on the left side menu and then on the button **+Portal** 

    ![Create dev portal](images/create-dev-portal.png)

2. Click on the dev portal that was just created and select the **APIs** menu, so you can publish you API product.

    ![Create dev portal](images/add-apis-to-dev-portal.png)

3. Select the BookAPIProduct that we created before and click **Next**

    ![Select API product for dev portal](images/select-api-product-for-dev-portal.png)

4. In **Spec Source** select **Choose a different spec** and select the spec that you added before. Once selected click on **Finish**

    ![Select API specification for dev portal](images/select-api-specification-for-dev-portal.png)

5. On the top right corner of the page click on **Live Portal** and then click on "Sign in" menu in the top bar. Sign up for a new developer account

    ![Sign up for developer account](images/sign-up-for-developer-account.png)

6. Enter the email, first name and last name.

    ![Enter developer account details](images/enter-developer-account-details.png)

7. Go and check your email account for a new email that will contain a link to verify your email address. Clicking on it you will go back to the portal signed in to your account.

8. Click on your email address on the top bar and then on the **My Apps** menu.

9. Create a new developer app

    ![Create app in dev portal](images/create-app-in-dev-portal.png)

10. Click on the name of the app that you just created an then on **Manage Products**

    ![Manage app products](images/manage-app-products.png)

11. Switch on access for the BookAPIProduct.

    ![Manage app products](images/switch-on-api-product.png)

12. Go back to the app list and click again on the app name and you will see that the key and the secret have been created.

    ![View app details](images/view-app-details.png)

13. Click on the **APIs** menu on the top bar and select the API product, so you can see the API documentation.

    ![View API documentation](images/view-api-documentation.png)

13. To be able to try out the API using the sandbox in the developer portal, we will need to add CORS support to our API proxy. You just need to go to back to the **Develop** tab in your API proxy and do the three following things:

14. Click on the **Authorize** button and enter your API key. The select one of the available path and click on **Try it out**.