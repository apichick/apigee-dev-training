Feature: Mock API (V1) Tests

    Scenario: Get Books - Success

        When I GET /books
        Then response code should be 200
        And response body should be valid xml
        And response body path //books/book[1]/id should be (.+)

    Scenario: Search Books - Success

        When I GET /books/search?q=War
        Then response code should be 200
        And response body should be valid xml
        And response body path //books/book/title should be ^(.*[wW][Aa][rR].*)$

    Scenario: Search Books - Missing Search Term

        When I GET /books/search
        Then response code should be 400

    Scenario: Get Book By Id - Success

        When I GET /books/121b4bb3-c971-4080-b230-571148b71969
        Then response code should be 200
        And response body should be valid xml
        And response body path //book/id should be 121b4bb3-c971-4080-b230-571148b71969

    Scenario: Get Author By Id - Not Found

        When I GET /books/invalid
        Then response code should be 404

    Scenario: Get Authors - Success

        When I GET /authors
        Then response code should be 200
        And response body should be valid xml
        And response body path //authors/author[1]/name should be (.+)

    Scenario: Search Authors - Success

        When I GET /authors/search?q=Jane
        Then response code should be 200
        And response body should be valid xml
        And response body path //authors/author/name should be ^(.*[jJ][Aa][nN][eE].*)$

    Scenario: Search Authors - Missing Search Term

        When I GET /authors/search
        Then response code should be 400

    Scenario: Get Author By Id - Succes

        When I GET /authors/3960590c-bdd1-4e6b-9e7b-383f3314a4aa
        Then response code should be 200
        And response body should be valid xml
        And response body path //author/id should be 3960590c-bdd1-4e6b-9e7b-383f3314a4aa

    Scenario: Get Author By Id - Not Found

        When I GET /authors/invalid
        Then response code should be 404


