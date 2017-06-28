import * as React from 'react';
import { Button } from 'react-photonkit';
import * as Net from 'net';

export default class Home extends React.Component {
  constructor() {
    super();
  }

  connectToServer() {
    // FIXME: This function doesn't belong into the view layer!
    var client = new Net.Socket();
    client.connect(13050, '127.0.0.1', function() {
      console.log('Connected');
      client.write('<protocol><join gameType="swc_2018_hase_und_igel"/>');
    });

    client.on('data', function(data) {
      console.log('Received: ' + data);
      client.destroy(); // kill client after server's response
    });

    client.on('close', function() {
      console.log('Connection closed');
    });
  }

  render() {
    return (
      <div>
        <Button text="Press me!" onClick={() => this.connectToServer()} />
        <div>Hello</div>
      </div>
    );
  }
}
