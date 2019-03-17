import * as React from 'react'
import { Logger } from '../api/Logger'
import { Button, CheckBox, Input } from './photon-fix/Components'
import { AppSettings } from './App'
import { useValue } from '../helpers/Controls'

const {app} = require('electron').remote


export class Administration extends React.Component<{ settings: AppSettings, setter: (settings: Partial<AppSettings>) => any }, AppSettings> {

  setValue(key: string): (event: any) => void {
    return useValue(value => {
      this.props.setter({[key]: value})
    })
  }

  render() {
    return (
      <div className="main-container">
        <div className="content">
          <div>Version: {app.getVersion()}</div>
          <CheckBox label="Spielzüge animieren" value={this.props.settings.animateMoves}
                    onChange={this.setValue('animateMoves')}/>
          <CheckBox label="Wasser animieren" value={this.props.settings.animateWater}
                    onChange={this.setValue('animateWater')}/>
          <label>Log-Verzeichnis (benötigt Neustart):
            <Input value={this.props.settings.logDir} onChange={this.setValue('logDir')}/></label><br/>
          <Button text="Log leeren" onClick={() => Logger.getLogger().clearLog()}/>
        </div>
      </div>
    )
  }
}
