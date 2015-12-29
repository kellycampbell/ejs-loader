var _ = require('lodash');
var loaderUtils = require("loader-utils");
var url = require("url");
var attrParse = require("./attributesParser");

function randomIdent() {
  return "xxxHTMLLINKxxx" + Math.random() + Math.random() + "xxx";
};



module.exports = function (source) {

  // console.log('ejs-loader');
  // console.dir(this);

  this.cacheable && this.cacheable();

  var attributes = ["img:src"];

  var query = loaderUtils.parseQuery(this.query);

  var root = query.root;
  var links = attrParse(source, function(tag, attr) {
    // console.log('tag='+ tag + ' attr='+attr);
    return attributes.indexOf(tag + ":" + attr) >= 0;
  });
  // console.log('links = ', links);
  links.reverse();
  var data = {};
  var content = [source];
  links.forEach(function(link) {
    if (!loaderUtils.isUrlRequest(link.value, root)) {
      // console.log('not url request: ' + link.value);
      return;
    }
    var uri = url.parse(link.value);
    // console.log('uri = ' + uri);
    if (uri.hash !== null && uri.hash !== undefined) {
      uri.hash = null;
      link.value = uri.format();
      link.length = link.value.length;
    }

    do {
      var ident = randomIdent();
    } while(data[ident]); // creates a randomIdent but goes back and creates another if collision 

    // console.log('ident = ' + ident);
    data[ident] = link.value;
    var x = content.pop();
    content.push(x.substr(link.start + link.length));
    content.push(ident);
    content.push(x.substr(0, link.start));
    // console.log('content = ', content);

  });
  content.reverse();
  content = content.join("");

  var result = content.replace(/xxxHTMLLINKxxx[0-9\.]+xxx/g, function(match) {
    if (!data[match]) {
      return match;
    }
    var u = loaderUtils.urlToRequest(data[match], root);
    // var reqUrl = JSON.stringify();
    return "<%= require('" + u + "') %>";
  });

  // console.log('result = ' + result);

  var template = _.template(result, query);

  return 'module.exports = ' + template;
};
