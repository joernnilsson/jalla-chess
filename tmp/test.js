var w;



var buffer = new ArrayBuffer(90000000);
var view = new Int32Array(buffer);
for(var c=0;c<view.length;c++) {
    view[c]=42;
}


function startWorker() {
  if (typeof(Worker) !== "undefined") {
    if (typeof(w) == "undefined") {
      w = new Worker("worker.js");
    }
    w.onmessage = function(event) {
      console.log("Main: "+event.data);
    };
  } else {
    console.error("Main: Not suported");
  }
}

function stopWorker() { 
  w.terminate();
  w = undefined;
}

setInterval(() => {
    console.log('Main: view.length = ' + view.length);
    //console.log('Main: buffer.byteLength = ' + buffer.byteLength);
}, 100);


startWorker();

setTimeout(() => {
    postMessage("Main: view[0] = " + view[0]);
    w.postMessage(buffer, [buffer]);
    postMessage("Main: view[0] = " + view[0]);
}, 3000);

