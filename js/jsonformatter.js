function is_array(obj) {
    return {}.toString.call(obj) == '[object Array]';
}


function traverse_children(element, func, depth) {
  for (var i = 0; i < element.childNodes.length; i++) {
    traverse_children(element.childNodes[i], func, depth + 1);
  }
  func(element, depth);
}


function multiply_string(num, str) {
  var sb = [];
  for (var i = 0; i < num; i++) {
    sb.push(str);
  }
  return sb.join("");
}

function get_dom(id){
    return document.getElementById(id);
}

function JsonFormatter(canvas,opts) {
    this.canvas = typeof(canvas) == 'string' ? get_dom('canvas'):canvas;
    this.singleTab = "  ";
    this.quoteKeys = false;
    this.isCollapsible = true;
    this._dateObj = new Date();
    this._regexpObj = new RegExp();

    this.tabString = multiply_string(2, this.singleTab);
}

JsonFormatter.imgCollapsed = "img/collapsed.gif";
JsonFormatter.imgExpanded = "img/expanded.gif";

JsonFormatter.expImgClicked = function(img) {
  var container = img.parentNode.nextSibling;
  if (!container) return;
  var disp = "none";
  var src = JsonFormatter.imgCollapsed;
  if (container.style.display == "none") {
    disp = "inline";
    src = JsonFormatter.imgExpanded;
  }
  container.style.display = disp;
  img.src = src;
}

var p = JsonFormatter.prototype;

p.process = function(json) {
  var html = "";
  var json = json || this.json;
  try {
    if (json == "") json = "\"\"";
    this.json = json;
    var obj = eval("[" + json + "]");
    html = this.processObject(obj[0], 0, false, false, false);
    this.canvas.innerHTML = "<pre class='CodeContainer'>" + html + "</pre>";
  } catch (e) {
    alert("JSON数据格式不正确:\n" + e.message);
    this.canvas.innerHTML = "";
  }
}

p.setTab = function(tabSize){
  var tabSize = tabSize || 2;
  this.tabString = multiply_string(tabSize, this.singleTab);
  this.process();
}

p.setIsCollapsible=function(isCollapsible){
    this.isCollapsible = isCollapsible;
    this.process();
}

p.setQuoteKeys = function(hasQuoteKeys){
    this.quoteKeys = hasQuoteKeys
    this.process();
}

p.processObject = function(obj, indent, addComma, isArray, isPropertyContent) {
    var html = "";
    var comma = (addComma) ? "<span class='Comma'>,</span> " : "";
    var type = typeof obj;
    var clpsHtml = "";
    if (is_array(obj)) {
        if (obj.length == 0) {
            html += this.getRow(indent, "<span class='ArrayBrace'>[ ]</span>" + comma, isPropertyContent);
        } else {
            clpsHtml = this.isCollapsible ? "<span><img src=\"" + JsonFormatter.imgExpanded + "\" onclick=\"JsonFormatter.expImgClicked(this)\" /></span><span class='collapsible'>" : "";
            html += this.getRow(indent, "<span class='ArrayBrace'>[</span>" + clpsHtml, isPropertyContent);
            for (var i = 0; i < obj.length; i++) {
                html += this.processObject(obj[i], indent + 1, i < (obj.length - 1), true, false);
            }
            clpsHtml = this.isCollapsible ? "</span>" : "";
            html += this.getRow(indent, clpsHtml + "<span class='ArrayBrace'>]</span>" + comma);
        }
    } else if (type == 'object') {
        if (obj == null) {
            html += this.formatLiteral("null", "", comma, indent, isArray, "Null");
        } else if (obj.constructor == this._dateObj.constructor) {
            html += this.formatLiteral("new Date(" + obj.getTime() + ") /*" + obj.toLocaleString() + "*/", "", comma, indent, isArray, "Date");
        } else if (obj.constructor == this._regexpObj.constructor) {
            html += this.formatLiteral("new RegExp(" + obj + ")", "", comma, indent, isArray, "RegExp");
        } else {
            var numProps = 0;
            for (var prop in obj) numProps++;
            if (numProps == 0) {
                html += this.getRow(indent, "<span class='ObjectBrace'>{ }</span>" + comma, isPropertyContent);
            } else {
                clpsHtml = this.isCollapsible ? "<span><img src=\"" + JsonFormatter.imgExpanded + "\" onclick=\"JsonFormatter.expImgClicked(this)\" /></span><span class='collapsible'>" : "";
                html += this.getRow(indent, "<span class='ObjectBrace'>{</span>" + clpsHtml, isPropertyContent);

                var j = 0;
                for (var prop in obj) {
                    var quote = this.quoteKeys ? "\"" : "";
                    html += this.getRow(indent + 1, "<span class='PropertyName'>" + quote + prop + quote + "</span>: " + this.processObject(obj[prop], indent + 1, ++j < numProps, false, true));
                }
                clpsHtml = this.isCollapsible ? "</span>" : "";
                html += this.getRow(indent, clpsHtml + "<span class='ObjectBrace'>}</span>" + comma);
            }
        }

    } else if (type == 'number') {
        html += this.formatLiteral(obj, "", comma, indent, isArray, "Number");
    } else if (type == 'boolean') {
        html += this.formatLiteral(obj, "", comma, indent, isArray, "Boolean");
    } else if (type == 'function') {
        if (obj.constructor == this._regexpObj.constructor) {
            html += this.formatLiteral("new RegExp(" + obj + ")", "", comma, indent, isArray, "RegExp");
        } else {
            obj = this.formatFunction(indent, obj);
            html += this.formatLiteral(obj, "", comma, indent, isArray, "Function");
        }

    } else if (type == 'undefined') {
        html += this.formatLiteral("undefined", "", comma, indent, isArray, "Null");
    } else {
        html += this.formatLiteral(obj.toString().split("\\").join("\\\\").split('"').join('\\"'), "\"", comma, indent, isArray, "String");
    }
    return html;
}

p.formatLiteral = function(literal, quote, comma, indent, isArray, style) {
    if (typeof literal == 'string')
        literal = literal.split("<").join("&lt;").split(">").join("&gt;");
    if((/^http:\/\/.*/).test(literal)){
        literal = "<a href='"+literal+"' target='_blank'>"+literal+"</a>";
    }
    var str = "<span class='" + style + "'>" + quote + literal + quote + comma + "</span>";
    if (isArray) str = this.getRow(indent, str);
    return str;
}

p.formatFunction = function(indent, obj){
  var tabs = "";
  for (var i = 0; i < indent; i++) tabs += this.tabString;
  var funcStrArray = obj.toString().split("\n");

  var str = "";
  for (var i = 0; i < funcStrArray.length; i++) {
    str += ((i == 0) ? "" : tabs) + funcStrArray[i] + "\n";
  }
  return str;
}

p.getRow = function(indent, data, isPropertyContent){
  var tabs = "";
  for (var i = 0; i < indent && !isPropertyContent; i++) tabs += this.tabString;
  if (data != null && data.length > 0 && data.charAt(data.length - 1) != "\n")
    data = data + "\n";
  return tabs + data;
}

p.collapseAllClicked = function(){
  this.ensureIsPopulated();
  var self = this;
  traverse_children(this.canvas, function(element) {
    if (element.className == 'collapsible') {
      self.makeContentVisible(element, false);
    }
  }, 0);
}

p.expandAllClicked = function(){
  this.ensureIsPopulated();
  var self = this;
  traverse_children(this.canvas, function(element) {
    if (element.className == 'collapsible') {
      self.makeContentVisible(element, true);
    }
  }, 0);
}

p.makeContentVisible = function(element, visible){
  var img = element.previousSibling.firstChild;
  if (!!img.tagName && img.tagName.toLowerCase() == "img") {
    element.style.display = visible ? 'inline' : 'none';
    element.previousSibling.firstChild.src = visible ? JsonFormatter.imgExpanded : JsonFormatter.imgCollapsed;
  }
}

p.collapseLevel = function (level) {
  this.ensureIsPopulated();
  var self = this;
  traverse_children(this.canvas, function(element, depth) {
    if (element.className == 'collapsible') {
      if (depth >= level) {
        self.makeContentVisible(element, false);
      } else {
        self.makeContentVisible(element, true);
      }
    }
  }, 0);
}

p.ensureIsPopulated = function () {
  if (!this.canvas.innerHTML && !!get_dom("RawJson").value) {
        Process();
    }
}

p.selectAllClicked = function() {
  if (!!document.selection && !!document.selection.empty) {
    document.selection.empty();
  } else if (window.getSelection) {
    var sel = window.getSelection();
    if (sel.removeAllRanges) {
      window.getSelection().removeAllRanges();
    }
  }

  var range = (!!document.body && !!document.body.createTextRange) ? document.body.createTextRange() : document.createRange();
  if (!!range.selectNode)
    range.selectNode(this.canvas);
  else if (range.moveToElementText)
    range.moveToElementText(this.canvas);
  if (!!range.select)
    range.select(this.canvas);
  else
    window.getSelection().addRange(range);
}
