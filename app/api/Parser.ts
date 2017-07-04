
const jsdom = require('jsdom');
import { parseString } from 'xml2js';


export module Parser {

  export function getJSONFromXML(xml): Promise<any> {
    return new Promise((res, rej) => {
      parseString(xml, function (err, result) {
        if (err) {
          rej(err);
        } else {
          res(result);
        }
      });
    });

  }

  function parse(text) {
    return new jsdom(text);
  }

}