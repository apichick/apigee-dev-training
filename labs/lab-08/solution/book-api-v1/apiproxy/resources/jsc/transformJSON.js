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