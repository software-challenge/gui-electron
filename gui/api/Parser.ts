
import { parseString } from 'xml2js';


export module Parser {

  export function getJSONFromXML(xml): Promise<any> {
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