import * as React from 'react'

export class ErrorPage extends React.PureComponent<{ Title: string, Message: string }, any> {
  render() {
    return (
      <div>Ein Fehler ist aufgetreten.</div>
    )
  }
}