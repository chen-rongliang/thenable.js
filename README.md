## Thenable.js: another Promise

项目的初衷，是抱着学习的目的，去了解、认识Promise的特性，顺路按照个人的习惯，改编了一份属于自己的 "Promise" 对象

除了仿制了 Promise 大部分特性外，还添加了 整合 其他 promise/a 规范的小小功能，像  Promise  和 jQuery.Deferred 等，终于能愉快一起玩耍啦，有情人终成兄妹~~~

## 初始化

熟悉 Promise 对象的同学，可这么用:
``` javascript
var thenable = new Thenable(function(resolve, reject) {
 resolve('normal');
});

thenable.then(function(data) {
  // data === 'normal'
});
```

个人偏向这么用:
``` javascript
var thenable = new Thenable();
thenable.then(function(data) {
  // data === 'normal'
});
thenable.resolve('normal');
```

两者等价


## API

### 1. thenable.resolve(any: All)

触发状态 "resolved"，进入 then 的 resolved 相关回调[done部分]。
如果 ``` thenable.resolve(obj) ``` 中，obje是一个 promise/a 规范的对象【肯定也可以 resolve 一个 Thenable 对象，必须的】，那么，将等待 obj 完成后，才会继续往下执行

举个例子:
``` javascript
var thenable = new Thenable();
thenable.resolve(new Promise(function(resolve){
  setTimeout(function(){
    resolve('normal');
  }, 1000);
}));

thenable.then(function(data) {
  // 等待1秒后，执行
  // data === 'normal'
  console.log(data);
});
```

### 2. thenable.reject(any: All)

触发 "rejected" 状态，进入 then 和 catch 中相关的回调[fail部分]
如果 reject 一个 promise/a 规范对象，并不会等待此对象执行完毕。

### 3. thenable.then(done: Function, fail: Function)

``` done: Function ``` 状态为 resolved 时的回调
``` fail: Function ``` 状态为 rejected 时的回调，相当于设置了一个 catch 的回调。

如果 then 的任意一个回调函数，无论是 done 和 fail，返回的是 promise/a 规范的对象，都会等待此对象的更变，而决定链条接下来的状态。

``` javascript
var thenable = new Thenable();
thenable.resolve('normal');

thenable.then(function(data) {
 // data === 'normal'
 console.log('1. ' + data);
}, function() {
  console.error('不会进入此逻辑');
})
.then(function(data) {
  // 因为上面的 then，没有设置 return
  // data === undefined
  console.log('2. ' + data);
  return 'hi';
})
.then(function(data) {
  // 上一个函数，有 return 的值
  // data === 'hi'
  console.log('3. ' + data);
})
.then(function() {
  // 与其他 promise/a 规范混合使用
  return Promise.reject('error');
})
.catch(function(data) {
  // 上一个 Promise 对象，reject 了 'error'
  // data === 'error'
  console.log('4. ' + data);

  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve('success');
    }, 1000);
  });
})
.then(function(data) {
  // 等待 catch 中的逻辑完成，然后1秒后输出
  // data === 'success'
  console.log('5. ' + data);
});


// 开始第二条链
thenable.then(function(data) {
  // 此链条，代表重新开始，获取到 resolve 设置的值
  // data === 'normal'
  console.log('第二轮:' + data);
});
```

### 4. thenable.catch(fail: Function)

等价于 ``` thenable(null, fail: Function) ```
