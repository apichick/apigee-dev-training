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