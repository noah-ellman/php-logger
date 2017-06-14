/**
 * Created by Noah on 4/21/2017.
 */
function addLog(data) {
    var container = $('#debug')[0];
    var div = document.createElement('div');
    div.innerHTML = data;
    if (container.children.length) {
        container.insertBefore(div, container.firstChild);
    }
    else {
        container.appendChild(div);
    }
}
$(function () {
    var slc;
    slc = new LiveLoggerClient({ port: 8082 });
    window['slc'] = slc;
    var container = $('#debug')[0];
    slc.on("log", function (msg) {
        addLog(msg);
    });
    slc.on("message", function (data) {
        console.log("adding msg");
        data = data.replace("\0", '');
        if (/^CLEAR/.test(data)) {
            $(container).empty();
            return;
        }
        var div = document.createElement('div');
        div.innerHTML = data;
        if (container.children.length) {
            container.insertBefore(div, container.firstChild);
        }
        else {
            container.appendChild(div);
        }
        if (container.childNodes.length > 200) {
            $(container).clear();
        }
    });
    slc.on("sending", function (data) {
        console.log("[Socket] <<  " + data);
    });
    slc.connect();
});
