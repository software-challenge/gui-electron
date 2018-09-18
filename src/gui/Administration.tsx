import * as React from 'react';
import { Button } from "react-photonkit";
import { Logger } from '../api/Logger';
import { CheckBox } from './photon-fix/Components';
import { AppSettings } from './App';


export class Administration extends React.Component<{ settings: AppSettings, setter: (settings: AppSettings) => any }, AppSettings> {
  private listener;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  componentDidUpdate(prevProps) {
  }

  render() {
    return (
      <div>
        <Button text="Clear Log" onClick={() => Logger.getLogger().clearLog()} />
        <CheckBox label="Spielzüge animieren" value={this.props.settings.animateViewer} onChange={(e) => {
            console.log("setting animateViewer to", !this.props.settings.animateViewer)
            this.props.setter({
              animateViewer: !this.props.settings.animateViewer
            })
          }} />
      </div>
    );
  }
}
