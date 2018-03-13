const express = require('express');
const app = express();
const router = express.Router();
const fs = require('fs');
const xpath = require('xpath');
const xmldom = require('xmldom');
const pd = require('pretty-data').pd;
const _ = require('lodash');

const PORT = 8080;

const content = fs.readFileSync('./mocks/data.xml').toString();
const doc = (new xmldom.DOMParser()).parseFromString(content);

const findAuthors = (path) => {
    var nodes = xpath.select(path, doc);
    if(!_.isEmpty(nodes)) {
        return nodes;
    } 
    return;
};

const findBooks = (path) => {
    var nodes = xpath.select(path, doc);
    if(!_.isEmpty(nodes)) {
        var books = [];
        for(var i = 0; i < nodes.length; i++) {
            var book = nodes[i].cloneNode(true);
            var author = nodes[i].parentNode.parentNode.cloneNode(true);
            for(var j = 0; j < author.childNodes.length; j++) {
                var childNode = author.childNodes[j];
                if(childNode.nodeName === 'books') {
                    author.removeChild(childNode);
                    break;  
                }
            }
            book.appendChild(author);
            books.push(book);
        }
        return books;
    } 
    return;
};

const sendItem = (res, nodes) => {
    if(nodes) {
        var document = (new xmldom.DOMImplementation()).createDocument(null, null, null);
        document.appendChild(document.createProcessingInstruction('xml', 'version="1.0"'));
        document.appendChild(nodes[0].cloneNode(true));
        res.header('Content-Type', 'text/xml').send(pd.xml(document.toString()));        
    } else {
        res.status(404).send();
    }
};

const sendItems = (res, rootNodeName, nodes) => {
    var document = (new xmldom.DOMImplementation()).createDocument(null, null, null);
    document.appendChild(document.createProcessingInstruction('xml', 'version="1.0"'));
    var rootNode = document.appendChild(document.createElement(rootNodeName));
    if(nodes) {
        for(var i = 0; i < nodes.length; i++) {
            rootNode.appendChild(nodes[i].cloneNode(true));
        }
    } 
    res.header('Content-Type', 'text/xml').send(pd.xml(document.toString()));
};

router.get('/authors', (req, res) => {
    res.header('Content-Type', 'text/xml').send(pd.xml(content));
});

router.get('/authors/search', (req, res) => {
    if(req.query.q) {
        sendItems(res, 'authors', findAuthors('//authors/author[./*[contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "'+ req.query.q.toLowerCase()+ '")]]'));
    } else {
        res.status(400).send();
    }
});

router.get('/authors/:id', (req, res) => {
    sendItem(res, findAuthors('//authors/author[id = "' + req.params.id + '"]'));
});

router.get('/books', (req, res) => {
    sendItems(res, 'books', findBooks('//authors/author/books/book'));
});

router.get('/books/search', (req, res) => {
    if(req.query.q) {
        sendItems(res, 'books', findBooks('//authors/author/books/book[./*[contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "'+ req.query.q.toLowerCase() + '")]]'));
    } else {
        res.status(400).send();
    }
});

router.get('/books/:id', (req, res) => {
    sendItem(res, findBooks('//authors/author/books/book[id = "' + req.params.id + '"]'));
});

app.use((req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
});
app.use('/library/v1', router);

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});
