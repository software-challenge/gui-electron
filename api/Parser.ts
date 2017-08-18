
import { parseString } from 'xml2js';


export module Parser {

  export function getJSONFromXML(xml: string): Promise<any> {

    //Workaround until I fix or replace the SAX parser
    xml = xml.trim();
    if (!xml.startsWith('<')) {
      xml = '<' + xml;
    }

    return new Promise((res, rej) => {
      parseString(xml, function (err, result) {
        if (err) {
          console.log("Error parsing xml:\n\n" + xml);
          rej(err);
        } else {
          res(result);
        }
      });
    });

  }

}