import * as React from 'react';
import { Button } from 'react-photonkit';

export default class Home extends React.Component {
  constructor() {
    super();
  }

  render() {
    return (
      <div>
        <Button text="Press me!" onClick={() => console.log('Clicked!')} />
        <div>Hello</div>
      </div>
    );
  }
}
