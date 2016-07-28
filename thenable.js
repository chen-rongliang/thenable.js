// by da宗熊
(function (root, factory) {
  if (typeof define === 'function') {
    if (define.amd) {
      // AMD
      define(factory);
    } else {
      // CMD
      define(function(require, exports, module) {
        module.exports = factory();
      });
    }
  } else if (typeof exports === 'object') {
    // Node, CommonJS之类的
    module.exports = factory();
  } else {
    // 浏览器全局变量(root 即 window)
    root.Thenable = factory();
  }
}(this, function factory() {
  'ust strict';

  function extend(source, obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        source[key] = obj[key];
      }
    }
  }

  function forEach(arr, callback) {
    for (var i = 0, max = arr.length; i < max; i++) {
      callback.call(arr, arr[i], i);
    }
  }

  function type(obj) {
    return Object.prototype.toString
      .call(obj)
      .split(' ')[1]
      .slice(0, -1)
      .toLowerCase();
  }

  function toArray(obj) {
    return [].slice.call(obj, 0);
  }

  function isThenable(obj) {
    return obj
      && type(obj) === 'object'
      && type(obj.then) === 'function';
  }

  var PENDING = 'pending';
  var RESOLVED = 'resolved';
  var REJECTED = 'rejected';

  function Thenable(fn) {
    var self = this;
    self.state = PENDING;
    self.result = null;
    self.runners = [];

    if (type(fn) === 'function') {
      fn(
        function(any) { self.resolve(any); },
        function(any) { self.reject(any); }
      );
    }
  }

  extend(Thenable.prototype, {
    isPedding: function() {
      return this.state === PENDING;
    },

    isResolved: function() {
      return this.state === RESOLVED;
    },

    isRejected: function() {
      return this.state === REJECTED;
    },

    _exec: function() {
      var self = this;

      if (!self.isPedding()) {
        forEach(self.runners, function(runner) {
          runner._exec(self.result, self.state);
        });
        self.runners = [];
      }

      return self;
    },

    resolve: function(any) {
      var self = this;

      if (self.isPedding()) {
        if (isThenable(any)) {
          any.then(
            function(data) { self.resolve(data); },
            function(error) { self.reject(error); }
          );
        } else {
          self.state = RESOLVED;
          self.result = any;
        }
      }

      return self._exec();
    },

    reject: function(any) {
      var self = this;

      if (self.isPedding()) {
        self.state = REJECTED;
        self.result = any;
      }

      return self._exec();
    },

    then: function(resolveFn, rejectFn) {
      var self = this;
      var runner = new ThenableRunner(self);
      runner.then(resolveFn, rejectFn);

      self.runners.push(runner);
      self._exec();

      return runner;
    },

    'catch': function(fn) {
      return this.then(null, fn);
    }
  });

  // Runner 用于多个then之间的隔离
  // 多次 then，都能拿到第1次的 resolve 的结果:
  //    t.resolve(1); -> t.then(data === 1); t.then(data === 1);
  // 链式的 then，可以拿到上一次的结果
  //    t.then(() => 1).then(data === 1);
  function ThenableRunner(parent) {
    this.parent = parent;
    this.result = null;
    this.state = PENDING;
    this.runs = []; // [ [done1, fail1], [done2, fail2] ]
  }

  extend(ThenableRunner.prototype, {
    _exec: function(result, state) {
      var self = this;

      self.state = state;
      if (state === PENDING) {
        return self;
      }

      var runs = self.runs;
      var fns;

      while (fns = runs.shift()) {
        var done = fns[0], fail = fns[1];
        var isDone = done && state === RESOLVED;
        var isFail = fail && state === REJECTED;

        if (isDone) {
          result = done(result);
        } else if (isFail) {
          result = fail(result);
          // 根据 promise/a 规范，这时候，需要把状态，更改为 resolved 了
          self.state = state = RESOLVED;
        }

        if ((isDone || isFail) && isThenable(result)) {
          self.state = PENDING;
          result.then(
            function(data) { self._exec(data, RESOLVED); },
            function(error) { self._exec(error, REJECTED); }
          );
          break;
        }

        self.result = result;
      }

      return self;
    },

    then: function(done, fail) {
      this.runs.push([done, fail]);
      return this._exec(this.result, this.state);
    },

    'catch': function(fail) {
      return this.then(null, fail);
    }
  });

  extend(Thenable, {
    reject: function(val) {
      var thenable = new Thenable();
      return thenable.reject(val);
    },

    resolve: function(val) {
      var thenable = new Thenable();
      return thenable.resolve(val);
    },

    all: function(thenables) {
      if (type(thenables) !== 'array') {
        thenables = toArray(arguments);
      }

      var thenable = new Thenable();
      var length = thenables.length;
      var counter = 0;
      var result = {
        length: length
      };

      function checkFinish() {
        if (counter >= length) {
          thenable.resolve(toArray(result));
        }
      }

      forEach(thenables, function(item, index) {
        if (!(item instanceof Thenable)) {
          item = Thenable.resolve(item);
        }
        item.then(
          function(data) { result[index] = data; counter++; checkFinish(); },
          function(error) {
            thenable.reject(error);
          }
        );
      });

      checkFinish();

      return thenable;
    },

    race: function(thenables) {
      if (type(thenables) !== 'array') {
        thenables = toArray(arguments);
      }

      var thenable = new Thenable();

      forEach(thenables, function(item) {
        if (!(item instanceof Thenable)) {
          item = Thenable.resolve(item);
        }
        item.then(
          function(data) { thenable.resolve(data); },
          function(error) { thenable.reject(error); }
        );
      });

      return thenable;
    }
  });

  return Thenable;
}));
