var i = 0;

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  }

function timedCount() {
  i = i + 1;
  postMessage(i);
  console.log("Worker: "+i);
  setTimeout("timedCount()",1000);
}

//timedCount();


self.onmessage = function(e) {
    var buffer = e.data;
    var view = ArrayBuffer.isView(buffer);
    postMessage("Inside worker.js: buffer.byteLength = " + view.byteLength);
    
    postMessage("Inside worker.js: view[0] = " + view[0]);
    view[0] = 55;
    postMessage("Inside worker.js: view[0] = " + view[0]);

    postMessage("Inside worker.js: buffer.byteLength = " + e.data.byteLength);

    // Extend
    buffer2 = ArrayBuffer.transfer(buffer, buffer.byteLength*2);

    var view2 = ArrayBuffer.isView(buffer2);


    postMessage("Inside worker.js: buffer.byteLength = " + buffer. byteLength);
    postMessage("Inside worker.js: buffer2.byteLength = " + buffer2. byteLength);


    postMessage("Inside worker.js: view[0] = " + view[0]);
    postMessage("Inside worker.js: view2[0] = " + view2[0]);
    view2[0] = 66;
    postMessage("Inside worker.js: view[0] = " + view[0]);
    postMessage("Inside worker.js: view2[0] = " + view2[0]);

    sleep(20000);

    postMessage("Worker returning");
  };

