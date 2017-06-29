import * as React from 'react';
import { Toolbar, Actionbar, Button, ButtonGroup, Window, Content, PaneGroup ,Pane } from "react-photonkit";

export default class App extends React.Component {

  constructor() {
    super();
  }

  render() {
    return (
      <Window>
        <Toolbar title="Some cool title">
          <Actionbar>
            <ButtonGroup>
              <Button glyph="home" />
              <Button glyph="github" />
            </ButtonGroup>
          </Actionbar>
        </Toolbar>
        {this.props.children}
      </Window>
    );
  }
}
