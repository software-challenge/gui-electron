import * as React from 'react'
import { Logger } from '../api/Logger'
import { Input, SelectBox, Button, CheckBox } from './photon-fix/Components'
import { AppSettings } from './App'
import { useValue } from '../helpers/Controls'


export class Administration extends React.Component<{ settings: AppSettings, setter: (settings: Partial<AppSettings>) => any }, AppSettings> {
  private listener

  constructor(props) {
    super(props)
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  componentDidUpdate(prevProps) {
  }

  setValue(key: string): (event: any) => void {
    return useValue(value => {
      this.props.setter({ [key]: value })
    })
  }

  render() {
    return (
      <div className="main-container">
        <div className="content">
          <Button text="Clear Log" onClick={() => Logger.getLogger().clearLog()} />
          <CheckBox label="Spielzüge animieren" value={this.props.settings.animateViewer} onChange={this.setValue("animateViewer")} />
        </div>
      </div>
    );
  }
}
