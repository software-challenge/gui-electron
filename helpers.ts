namespace Helpers{
    export let ajax = function(url: string, callback: (result: string)=> void):void{
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function(){
            if(xhttp.readyState == 4 && xhttp.status == 200){
                callback(xhttp.responseText);
            }
        }
        xhttp.open("GET",url);
        xhttp.send();
    }
}