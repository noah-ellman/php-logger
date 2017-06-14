/**
 * Created by Noah on 4/21/2017.
 */

function addLog(data) {
    const container = $('#debug')[0];
    const div = document.createElement('div');
    div.innerHTML = data;
    if (container.children.length) {
        container.insertBefore(div, container.firstChild)
    } else {
        container.appendChild(div);
    }
}

$(function () {

    let slc;


    slc = new LiveLoggerClient({port: 8082});

    window['slc'] = slc;

    const container = $('#debug')[0];
    slc.on("log", msg => {
       addLog(msg);
    });
    slc.on("message", (data) => {
        console.log("adding msg");
        data = data.replace("\0",'');
        if (/^CLEAR/.test(data)) {
            $(container).empty();
            return;
        }
        const div = document.createElement('div');
        div.innerHTML = data;
        if (container.children.length) {
            container.insertBefore(div, container.firstChild)
        } else {
            container.appendChild(div);
        }
        if( container.childNodes.length > 200 ) { $(container).clear(); }
    });
    slc.on("sending", (data) => {
        console.log("[Socket] <<  " + data);
    });

    slc.connect();

});

