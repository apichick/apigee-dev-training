/*jshint esversion: 6 */
const apickli = require('apickli');
const {
    Before
} = require('cucumber');

Before(function () {
    this.apickli = new apickli.Apickli("http", "localhost:8080/library/v1");
});