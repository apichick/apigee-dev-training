var payload = JSON.parse(context.getVariable('response.content'));
context.setVariable('bookid', payload.id);
context.setVariable('booktitle', payload.title);
context.setVariable('bookprice', parseFloat(payload.price.replace(/[^\d.]/g, '')));