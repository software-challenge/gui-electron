import * as React from 'react';


export class UnicodeIcon extends React.PureComponent<{ icon: string }, any>{
  render() {
    return (
      <span className="unicode-icon">{this.props.icon}</span>
    )
  }
}
