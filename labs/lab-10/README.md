# Lab 10 - Automated Deployment and Testing (Maven)
## Introduction

The main objective of this lab is to learn how to automate the deployment and testing on an API proxy using maven

## Instructions

1. If it does not exist yet, create a file called settings.xml inside your home directory's .m2 sub-directory (Mac OS, Unix: $HOME/.m2/settings.xml, Windows: %USERPROFILE%/.m2/settings.xml). In that file add a profile with your Apigee credentials as properties and activate it (See example below). This way you will not need to enter your credentials every time you deploy an API proxy.

        <settings xmlns="http://maven.apache.org/SETTINGS/1.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
                            https://maven.apache.org/xsd/settings-1.0.0.xsd">
            <profiles>
                <profile>
                    <id>public</id>
                    <properties>
                        <username>USERNAME</username>
                        <password>PASSWORD</password>
                    </properties>
                </profile>
            </profiles>
            <activeProfiles>
                <activeProfile>public</activeProfile>
            </activeProfiles>
        </settings>

1. Copy the book-api-v1 directory from the lab 02 solution in a directory in your file system

2. Change to the book-api-v1 directory

        $ cd book-api-v1

3. Inside that directory copy the test directory from the solution of lab-09

4. Inside that same directory copy the pom.xml file available [here](solution/book-api-v1/pom.xml)

5. Deploy and run your tests using maven

        $ mvn install -Dorg=ORGANIZATION -Denv=ENVIRONMENT -Dapikey=API-KEY
