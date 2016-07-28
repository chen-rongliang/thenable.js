// 临时测试，下次就弄出去使用~

var timeout = 5000;
var timer;
var index = 0;
function loopTest(cc) {
  var item = cc.shift();
  if (!item) {
    return logInfo('all success');
  }
  index++;
  var desc = item.desc || index;
  logInfo(index + '.' + desc);
  if (item.run) {
    var shouldStopRunner = false;
    clearTimeout(timer);
    timer = setTimeout(function(){
      shouldStopRunner = true;
      logError('  timeout');
    }, item.timeout || timeout);
    try {
      item.run(function(error) {
        clearTimeout(timer);
        if (shouldStopRunner) {
          return;
        }
        if (error) {
          logError('  ' + error);
        } else {
          logInfo('  pass');
          loopTest(cc);
        }
      });
    } catch (e) {
      clearTimeout(timer);
      logError('  ' + e.message);
      throw e;
    }
  }
}
var $logger;
function logForIE(text, color) {
  if (!$logger) {
    $logger = document.createElement('div');
    document.getElementsByTagName('body')[0].appendChild($logger);
  }
  $logger.innerHTML += '<div style="color:'+ color +'">'+ text +'</div>'
}
function logInfo(text) {
  if (window.console) {
    console.log('%c' + text, 'color:green');
  } else {
    logForIE(text, 'green');
  }
}
function logError(text) {
  if (window.console) {
    console.log('%c' + text, 'color:red');
  } else {
    logForIE(text, 'red');
  }
}
