function loadXML(url, callback){
    fetch(url)
        .then(a => a.text())
        .then(r => {
            var parser = new DOMParser();
            var doc = parser.parseFromString(r, "application/xml");
            callback(doc.documentElement);
        });
}