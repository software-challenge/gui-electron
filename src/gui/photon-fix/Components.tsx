import * as React from 'react'

export function Window(props) {
  return <div className='window'>{props.children}</div>
}

export function Toolbar(props) {
  return <header className='toolbar toolbar-header'>{props.children}</header>
}

export function ToolbarActions(props) {
  return <div className='toolbar-actions'>{props.children}</div>
}

export function ButtonGroup(props) {
  return <div className='btn-group'>{props.children}</div>
}

export class RetractableSidebar extends React.Component<{ retracted: boolean, id?: string, className?: string }, any> {
  render() {
    let cn = 'pane-sm sidebar retractable'
    if (this.props.retracted) {
      cn += ' retracted'
    }
    if (this.props.className) {
      cn += ' ' + this.props.className
    }
    return <div className={cn} id={this.props.id}> {this.props.children}</div>
  }
}

export function PaneGroup(props) {
  return <div className='pane-group'>{props.children}</div>
}

export function Pane(props) {
  return <div className='pane'>{props.children}</div>
}

export function Icon(props: { i: string }) {
  return <span className={'icon icon-' + props.i}></span>
}

export function Button(props: { icon?: string, text?: string, onClick?: (e: any) => void, active?: boolean, enabled?: boolean, pullRight?: boolean, children?: any }) {
  let ic
  if (props.icon) {
    ic = <Icon i={props.icon}/>
  }

  let cn = 'btn btn-default'
  if (props.active) {
    cn += ' active'
  }

  if (props.pullRight) {
    cn += ' pull-right'
  }

  let disabled = false
  if (props.enabled === false) {
    disabled = true
  }

  return <button onClick={e => props.onClick(e)} className={cn}
                 disabled={disabled}>{ic}{props.text}{props.children}</button>
}

export interface SelectItem {
  label: string;
  value: string;
}

export function SelectBox(props: { value: string, items: SelectItem[], onChange?: (e: any) => void }) {
  const options = props.items.map(i => <option key={i.value} value={i.value}>{i.label}</option>)
  return <select className='form-control' value={props.value} onChange={props.onChange}>
    {options}
  </select>
}

export function Input(props: { value: string, onChange?: (e: any) => void, id?: string, invalid?: boolean }) {
  const classes = ['form-control']
  if (props.invalid) {
    classes.push('validation-errors')
  }
  return <input className={classes.join(' ')} value={props.value} onChange={props.onChange}
                id={props.id}/>
}

export function CheckBox(props: { label: string, value: boolean, onChange?: (e: any) => void }) {
  return <div className='checkbox'>
    <label>
      <input type='checkbox' checked={props.value} onChange={props.onChange}/>
      {props.label}
    </label>
  </div>
}
