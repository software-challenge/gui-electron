export namespace Helpers {
  export let ajax = function (url: string, callback: (result: string) => void): void {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        callback(xhttp.responseText);
      }
    }
    xhttp.open("GET", url);
    xhttp.send();
  }
  export let getXmlDocument = async function (url: string): Promise<XMLDocument> {
    return new Promise<XMLDocument>(resolve => {
      Helpers.ajax(url, (replay: string) => {//Get replay by ajax
        var parser = new DOMParser();//Parse to xml DOM tree
        var xml = parser.parseFromString(replay, "text/xml");
        resolve(xml);
      });
    });

  }

  var uid = 0;
  export let getUID = function (): number {
    return uid++;
  }
}