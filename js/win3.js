;(function () {
  var Win = function (obj) {
    if (!(this instanceof Win)) throw new Error("Instance required");
    this.id = obj.id || this.id;
    this.width = obj.width || this.width || 400;
    this.height = obj.height || this.height || 300;
    this.top = obj.top || this.top || 50;
    this.left = obj.left || this.left || 50;
    this.color = obj.color || this.color || "#515c6b";
    this.className = obj.className || this.className || "";
    this.containerId = obj.containerId || "window_container";

    this.resizable = obj.resizable || this.resizable || true;
    this.draggable = obj.draggable || this.draggable || true;
    this.title = obj.title || this.title;
    this.btnGroup = obj.btnGroup || this.btnGroup || [1, 1, 1];

    var bf = function () {
      return true;
    };
    var cf = function(cb) {
      return cb();
    }
    this.onCreate = obj.onCreate || this.onCreate || bf;
    this.onClose = obj.onClose || this.onClose || cf; //  onClose(close)
    this.afterClose = obj.afterClose || this.afterClose || bf;
    this.onMouseDown = obj.onMouseDown || this.onMouseDown || bf;
    this.onClick = obj.onClick || this.onClick || bf;
    this.onDrag = obj.onDrag || this.onDrag || cf;  //arguments: (event, left, top)
    this.onResize = obj.onResize || this.onResize || cf;
    this.onMaximise = obj.onMaximise || this.onMaximise || cf;
    this.afterMaximise = obj.afterMaximise || this.afterMaximise || bf;
    this.onUndoMaximise = obj.onUndoMaximise || this.onUndoMaximise || cf;
    this.afterUndoMaximise = obj.afterUndoMaximise || this.afterUndoMaximise || bf;
    this.onMinimise = obj.onMinimise || this.onMinimise || cf;
    this.afterMinimise = obj.afterMinimise || this.afterMinimise || bf;
    this.onUndoMinimise = obj.onUndoMinimise || this.onUndoMinimise || cf;
    this.afterUndoMinimise = obj.afterUndoMinimise || this.afterUndoMinimise || bf;

    this._initiate();
  };
  Win.prototype = {
    /**
     * Initiation
     * @return {[type]} [description]
     */
    _initiate: function(){
      var id = this.id;
      this._DOM(id);  //creates a DOM element
      this._group_initiate();
      this._CSS();
      if (this.draggable) this._drag();
      if (this.resizable) this._resize();
      this._click();
      this.content = this.$(id + "_content");
      this.show();
      this.onCreate();
    },
    _DOM: function (id) {
      var html = '<div class="dragger" id="' + id + '_dragger"></div>';
      if (this.title)
        html += '<div class="title" id="' + id + '_title">' + this.title + '<div>';
      if (this.resizable)
        html += '<div class="resize" id="' + id + '_resize">' +
        '<div class="bar left"></div>' +
        '<div class="bar top"></div>' +
        '<div class="bar right"></div>' +
        '<div class="bar bottom"></div>' +
        '<div class="dot left-top"></div>' +
        '<div class="dot right-top"></div>' +
        '<div class="dot right-bottom"></div>' +
        '<div class="dot left-bottom"></div>' +
        '</div>';
      html += '<div class="btn-bar">';
      if (this.btnGroup[0])
        html += '<div class="btn btn-minimise" id="' + id + '_minimise"><div class="btn-icon"></div></div>';
      if (this.btnGroup[1])
        html += '<div class="btn btn-maximise" id="' + id + '_maximise"><div class="btn-icon"></div></div>';
      if (this.btnGroup[2])
        html += '<div class="btn btn-close" id="' + id + '_close"><div class="btn-icon"></div></div>';
      html += '</div><div class="content" id="' + id + '_content"></div>';
      var win = document.createElement("div");
      win.id = id;
      win.className = "window " + this.className;
      this.hide(win); //hides the window before css is ready
      this.win = win;
      win.innerHTML = html;
      this.$(this.containerId).appendChild(win);
    },
    /**
     * initiates an array to store windows instances and public variables for the first time
     * and updates variables for each instance added
     */
    _group_initiate: function(){
      var container =this.$(this.containerId),
      zIndex;

      if(!container){
        throw new Error("id of container element must be given");
      }

      if(!container.wins){  // if creating the first window
        //creates an array (group) of windows for the first time creating a window
        //windows within the group are in order, where those of higher indexes will display in front.
        container.wins = [];
        var wins = container.wins;

        this.index = 0; // index of this window in the array.

        //creates a object that stores group variables
        wins.args = {};
        wins.args.count = 1; // current count of windows
        wins.args.z_index = 10000; //initiates the highest z-index among all windows

        //document event
        //when clicking on elsewhere, the current selected window will be unselected
        var self = this;
        var f = function() {
          var wins = self.$(self.containerId).wins;
          if (wins.length === 0) return;
          var win = wins[wins.length - 1];
          self.unselect(win);
        }
        this.addEvent(document, "mousedown", f);
      }else {   //if the group of windows already exists
        var wins = container.wins;
        if (wins.length === 0) {// if there is no window left in the group, it is initiated to be the first one of the group
          wins.args.count = 1;
          wins.args.z_index = 10000;
          this.index = 0; // position in the array
        } else {
          var preWin = wins[wins.length - 1]; //previous window (currently displaying in the front)
          this.unselect(preWin);//unselects preWin
          this.index = wins.args.count; // position in the array
          ++wins.args.count;
          ++wins.args.z_index;
        }
      }
      this.wins = container.wins; // adds a pointer to the array
      this.wins.push(this);  //adds the new window to the group
    },
    _CSS: function () {
      var style = document.createElement("style");
      style.id = this.id+"_style";
      style.innerHTML = "#"+this.id+"{"+
        "width:"+this.width+"px"+
        ";height:"+this.height+"px"+
        ";top:"+this.top+"px"+
        ";left:"+this.left+"px"+
        ";background-color:"+this.color+
        ";border:1px solid "+this.color+
        ";z-index:"+this.wins.args.z_index+
      ";}";
      this.win.appendChild(style);
    },
    /**
     * allows user to drag the window
     * @return {[type]} [description]
     */
    _drag: function () {
      var self = this,
        win = this.win;
      // mousedown -> mousemove -> mouseup
      this.addEvent(this.$(this.id + "_dragger"), "mousedown", function (e) {
        e = e || window.event;
        if (e.button == 2) return; // blocks right clicks
        var dragger = self.$(self.id + "_dragger");
        self.addClass(dragger, "dragging"); // a class for cursor
        var d = document,
          x = e.clientX || e.offsetX,
          y = e.clientY || e.offsetY,
          top = win.offsetTop,
          left = win.offsetLeft,
          moved = false,
          maximised = false,
          max_btn = self.$(self.id + "_maximise");
        if (max_btn && self.hasClass(max_btn, "max")) maximised = true; // checks if the window is maximised
        var dmove = function (e) {  //mousemove, sets the top and left position of the window as the mouse moves
          e = e || window.event;
          if (e.clientX === x && e.clientY === y) return;
          var b = document.body,
            tx = e.clientX - x + left,
            ty = e.clientY - y + top;

          self.onDrag(function(){

            if (maximised) { // when it is maximised, it should return to it's former size, but follows the cursor still
              maximised = false;
              self.removeClass(max_btn, "max");
              var t1 = self.width,
              t2 = b.clientWidth;
              if (x < t1 / 2)
              left = 0;
              else if (x > t2 - t1 / 2)
              left = t2 - t1;
              else
              left = x - t1 / 2;
              left = left + b.scrollLeft;
              self.setCss({
                width: self.width + "px",
                height: self.height + "px",
                top: b.scrollTop + "px",
                left: left + "px"
              });
              self.left = left;
              self.show(self.$(self.id + "_resize"));
            } else {
              self.setCss({
                width: self.width + "px",
                height: self.height + "px",
                left: tx + "px",
                top: ty + "px"
              });
            }
            moved = true;
          }, e, tx, ty)

        };
        var dup = function (e) { //mouseup, makes position variables inherent to the window
          e.pageX = e.pageX || e.clientX + document.body.scrollLeft;
          self.removeClass(dragger, "dragging");  //removes class and events when action is done
          self.removeEvent(d, "mousemove", dmove);
          self.removeEvent(d, "mouseup", dup);
          if(!moved) return;
          var _top = win.offsetTop,
            _left = win.offsetLeft;
          if (_top <= -10 && e.pageX > 5 && self.btnGroup[1]) {  //if it's been moved to above the top margin it is to be maximsed
            self.maximise();
            // self.top = 0;
          } else if (e.pageX <= 5) {
            if(_top <= -10){
              var b = document.body;
              self.setCss({ //displays on the top-left quarter of the screen
                height: b.clientHeight/2+"px",
                width: b.clientWidth/2+"px",
                top: b.scrollTop+"px",
                left: b.scrollLeft+"px"
              });
            }else if(_top > -10){  //displays on the left half of the screen
              var b = document.body;
              self.setCss({
                height: b.clientHeight+"px",
                width: b.clientWidth/2+"px",
                top: b.scrollTop+"px",
                left: b.scrollLeft+"px"
              });
            }

          } else if (_top < 0) { // or depending on extent, just to cling on the top edge
            // self.top = 0;
            self.setCss({
              top: 0
            })
          } else {
            self.top = _top;
            self.left = _left;
          }
        };
        self.addEvent(d, "mousemove", dmove);
        self.addEvent(d, "mouseup", dup);
      });
    },
    /**
     * allows user to resize the window
     * @return {[type]} [description]
     */
    _resize: function () {
      var self = this,
        win = this.win;
      this.addEvent(this.$(this.id + "_resize"), "mousedown", function (e) { //mousedown -> mousemove -> mouseup
        e = e || window.event;
        if (e.button == 2) return;  // blocks right clicks
        var tg = e.srcElement ? e.srcElement : e.target, // distinguishes each part
          cls = tg.className.split(" ")[1],
          d = document,
          x = e.clientX || e.offsetX,
          y = e.clientY || e.offsetY,
          top = win.offsetTop,
          left = win.offsetLeft,
          width = win.offsetWidth,
          height = win.offsetHeight,
          style = self.$(self.id+"_style");
        var dmove = function (e) { //mousemove
          e = e || window.event;

          self.onResize(function(){
            var varianceX, varianceY;
            varianceX = e.clientX - x;
            varianceY = e.clientY - y;

            // 8 directions: left, right, top, bottom,
            //left-top or -bottom, right-top or bottom
            if (cls.indexOf("left") != -1) {
              if(varianceX> width -170) varianceX = width -170;   //css: min-width: 170px;
              self.setCss({
                width: (width - varianceX) + "px",
                left: (left + varianceX) + "px"
              }, style);
            } else if (cls.indexOf("right") != -1) {
              self.setCss({
                width: (width + varianceX) + "px",
              }, style);
            }
            if (cls.indexOf("top") != -1) {
              if(varianceY> height -130) varianceY = height -130; //css: min-height: 130px;
              self.setCss({
                height: (height - varianceY) + "px",
                top: (top + varianceY) + "px"
              }, style);
            } else if (cls.indexOf("bottom") != -1) {
              self.setCss({
                height: (height + varianceY) + "px",
              }, style);
            }
          }, e)

        };
        var dup = function () { //mouseup, makes position variables inherent to the window
          self.removeEvent(d, "mousemove", dmove);
          self.removeEvent(d, "mouseup", dup);
          self.width = win.offsetWidth;
          self.height = win.offsetHeight;
          self.top = win.offsetTop;
          self.left = win.offsetLeft;
          if (self.top < -10) { // stretches to maximum height
            var _height = d.body.clientHeight;
            self.top = 0;
            self.setCss({
              height: _height + "px",
              top: 0
            });
          } else if (self.top < 0) { //makes sure the window doesn't go beyond the top edge of the page
            self.top = 0;
            self.setCss({
              top: 0
            });
          }
        };
      self.addEvent(d, "mousemove", dmove);
      self.addEvent(d, "mouseup", dup);
      });
    },
    /**
     * binds click events
     * @return {[type]} [description]
     */
    _click: function () {
      var self = this;
      this.$(this.id + "_dragger").ondblclick = function (e) { //maximises the window when double click occurs to dragger
        e = e || window.event;
        self.stopPropagation(e);
        if (self.btnGroup[1]) self.maximise();
      };
      if (this.btnGroup[0])
        this.$(this.id + "_minimise").onclick = function (e) {
          e = e || window.event;
          self.stopPropagation(e);
          self.minimise();
        };
      if (this.btnGroup[1])
        this.$(this.id + "_maximise").onclick = function (e) {
          e = e || window.event;
          self.stopPropagation(e);
          self.maximise();
        };
      if (this.btnGroup[2])
        this.$(this.id + "_close").onclick = function (e) {
          e = e || window.event;
          self.stopPropagation(e);
          self.close();
        };
      this.win.onclick = function (e) {
        e = e || window.event;
        self.stopPropagation(e);
        self.onClick(e);
      };
      this.win.onmousedown = function (e) {
        e = e || window.event;
        self.stopPropagation(e);
        self.pushToTail();
        self.onMouseDown(e);
      };
    },
    /**
     * maximises the window or undoes maximisation
     * @return {[type]} [description]
     */
    maximise: function () {
      var b = document.body;
      var btn = this.$(this.id + "_maximise");
      var self = this;

      if (!this.hasClass(btn, "max")) { //if is maximisation

        this.onMaximise(function(){

          self.setCss({
            width: b.clientWidth + "px",
            height: b.clientHeight + "px",
            top: b.scrollTop + "px",
            left: b.scrollLeft + "px"
          });
          self.addClass(btn, "max");
          self.hide(self.$(self.id + "_resize"));
          //makes sure the window doesn't go beyond the top edge of the page
          if (self.top < 0) self.top = 0;
          var t = b.clientWidth - self.width;
          if (self.left > t) self.left = t + b.scrollLeft;
          t = b.clientHeight;
          if (self.top > t - 45) self.top = t - 45 + b.scrollTop;

          self.afterMaximise();

        })


      } else { // if not

        this.onUndoMaximise(function(){

          self.setCss({
            width: self.width + "px",
            height: self.height + "px",
            top: self.top + "px",
            left: self.left + "px"
          });
          self.removeClass(btn, "max");
          self.show(self.$(self.id + "_resize"));

          self.afterUndoMaximise();

        })
      }
    },
    /**
     * minimises the window
     * @return {[type]} [description]
     */
    minimise: function () {

      var self = this;
      this.onMinimise(function(){

        self.hide();
        self.pushToHead();

        self.afterMinimise();
      })
      return this;
    },
    /**
     * undoes minimisation
     * @return {[type]} [description]
     */
    undoMinimise: function () {
      var self = this;
      this.onUndoMinimise(function(){
        self.show();
        self.pushToTail();

        self.afterUndoMinimise();
      })
      return this;
    },
    /**
     * closes the window
     * @return {[type]} [description]
     */
    close: function () {

      var self = this;

      this.onClose(function(){

        var wins = self.wins,
        i = self.index;
        self.win.parentNode.removeChild(self.win); //removes it from DOM
        wins.splice(i, 1);  //removes it from group
        wins.args.count--;
        if (wins.length > 0) {
          self.select(wins[wins.length - 1]);
        }

        self.afterClose();
      })
      return this;
    },
    /**
     * pushes the window to the tail of the array and displays it on the front
     * @return {[type]} [description]
     */
    pushToTail: function () {
      var wins = this.wins;

      if(this.index == wins.length -1){ //is already the tail
        if (this.hasClass(this.win, "unselected")) {
          this.select();
        }
        return this;
      }

      var i = this.index;
      wins.splice(i, 1); // removes it from the array
      wins.push(this);  // adds it back as the tail
      this.index = wins.length - 1;
      var preWin = wins[wins.length - 2];
      this.select().unselect(preWin);
      for (; i < wins.length - 1; i++) { //resets the indices
        wins[i].index--;
      }
      return this;
    },
    /**
     * pushes the window to the head of the array
     * @return {[type]} [description]
     */
    pushToHead: function () {
      var wins =this.wins;
      if (wins.length <= 1) return this;
      var i = this.index,
        t = i;
      for (; t > 0; t--) {
        wins[t] = wins[t - 1];
        wins[t].index++;
      }
      wins[0] = this;
      wins[0].index = 0;
      this.setCss({
        z_index: wins[1].win.style.zIndex - 1
      });
      var preWin = wins[wins.length - 1];  // previous window
      this.unselect().select(preWin);
      return this;
    },

    unselect: function (Win) {
      var Win = Win || this;
      if (this.addClass(Win.win, "unselected")) {
        var style = this.$(Win.id+"_style");
        this.setCss({
          background_color: "#fff",
          border: "1px solid #b5b9c0"
        }, style);
      }
      return this;
    },
    select: function (Win) {
      var Win = Win || this,
        color = Win.color;
      this.removeClass(Win.win, "unselected");
      var style = this.$(Win.id+"_style");
      this.setCss({
        background_color: color,
        border: "1px solid " + color,
        z_index: ++(this.wins.args.z_index)
      }, style);
      return this;
    },
    addEvent: function (ele, type, cb) {
      if (ele.addEventListener) {
        ele.addEventListener(type, cb, false);
      } else if (ele.attachEvent) {
        ele.attachEvent('on' + type, cb);
      } else {
        ele['on' + type] = cb;
      }
    },
    removeEvent: function (ele, type, cb) {
      if (ele.removeEventListener) {
        ele.removeEventListener(type, cb, false);
      } else if (ele.detachEvent) {
        ele.detachEvent('on' + type, cb);
      } else {
        ele['on' + type] = null;
      }
    },
    stopPropagation: function (e) {
      if (e.stopPropagation) {
        e.stopPropagation();
      } else {
        e.cancelBubble = true;
      }
    },
    /**
     * sets css
     * @param {[type]} obj   css
     * @param {[type]} style style element
     */
    setCss: function(obj, style){
      var style = style||this.$(this.id+"_style"),
        css = style.innerHTML,
        regs = "";
      for(var key in obj){
        regs = "([;\\{]\\s*"+key.replace("_","-")+"\\s*:\\s*)[^;]*([;\\}]{1,2})";
        css = css.replace(new RegExp(regs), "$1"+obj[key]+"$2");
      }
      style.innerHTML = css;
    },
    /**
     * gets css
     * @param  {[type]} arr names
     * @return {[type]}     values
     */
    getCss: function(arr){
      var style = this.$(this.id+"_style"),
        css = style.innerHTML,
        regs = "",
        i = 0;
      for(;i<arr.length;i++){
        regs = ".*\\b"+arr[i].replace("_","-")+"\\s*:\\s*([^;]*)[;\\}]";
        var match = css.match(new RegExp(regs));
        if(match)
          arr[i] = match[1];
        else arr[i] = "";
      }
      return arr;
    },
    hide: function(win){
      var win = win||this.win;
      win.style.visibility = "hidden";
    },
    show: function(win){
      var win = win||this.win;
      win.style.visibility = "visible";
    },
    $: function (s) {
      return document.getElementById(s);
    },
    /**
     * adds classname
     * @param {[type]} obj  [description]
     * @param {[type]} cls  [description]
     * @param {[type]} flag when true, adds the class whether or not it already exists
     */
    addClass: function (obj, cls, flag) {
      if (!flag&&this.hasClass(obj, cls)) return false;
      var obj_class = obj.className,
        blank = (obj_class !== '') ? ' ' : '';
      added = obj_class + blank + cls;
      obj.className = added;
      return true;
    },
    removeClass: function (obj, cls) {
      var obj_class = ' ' + obj.className + ' ';
      obj_class = obj_class.replace(/(\s+)/gi, '  ');
      var removed = obj_class.replace(new RegExp("\\s"+cls+"\\s", "g"), ' ');
      removed = removed.replace(/(^\s+)|(\s+$)/g, '');
      obj.className = removed;
    },
    hasClass: function (obj, cls) {
      var classes = obj.className,
        class_lst = classes.split(/\s+/);
      x = 0;
      for (; x < class_lst.length; x++) {
        if (class_lst[x] == cls) {
          return true;
        }
      }
      return false;
    }
  };
  window.Win = Win;
})();
