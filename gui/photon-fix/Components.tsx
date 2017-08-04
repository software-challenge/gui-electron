import * as React from 'react';


export class Window extends React.PureComponent {
  render() {
    return (
      <div className="window">{this.props.children}</div>
    )
  }
}

export class Toolbar extends React.PureComponent {
  render() {
    return (
      <header className="toolbar toolbar-header">{this.props.children}</header>
    )
  }
}

export class ToolbarActions extends React.Component {
  render() {
    return <div className="toolbar-actions">{this.props.children}</div>;
  }
}

export class ButtonGroup extends React.Component {
  render() {
    return <div className="btn-group">{this.props.children}</div>
  }
}

export class Content extends React.Component {
  render() {
    return (
      <div className="window-content">
        {this.props.children}
      </div>
    )
  }

  propTypes = { children: React.PropTypes.node };
}

export class Sidebar extends React.Component {
  render() {
    return (
      <div className="pane-sm sidebar">{this.props.children}</div>
    )
  }
}

export class RetractableSidebar extends React.Component<{ retracted: boolean, id?: string, className?: string }, any>{
  render() {
    var cn = "pane-sm sidebar retractable";
    if (this.props.retracted) {
      cn += " retracted";
    }
    if (this.props.className) {
      cn += " " + this.props.className
    }
    return <div className={cn} id={this.props.id}> {this.props.children}</div >;
  }
}

export class PaneGroup extends React.Component {
  render() {
    return (
      <div className="pane-group">{this.props.children}</div>
    )
  }
}

export class Pane extends React.Component {
  render() {
    return (
      <div className="pane">{this.props.children}</div>
    )
  }
}

export class Icon extends React.PureComponent<{ i: string }, any>{
  render() {
    return <span className={"icon icon-" + this.props.i}></span>
  }
}

export class Button extends React.PureComponent<{ icon?: string, text?: string, onClick?: (e: any) => void, active?: boolean, enabled?: boolean, pullRight?: boolean }, any>{
  render() {
    var ic;
    if (this.props.icon) {
      ic = <Icon i={this.props.icon} />;
    }

    var cn = "btn btn-default";
    if (this.props.active) {
      cn += " active";
    }

    if (this.props.pullRight) {
      cn += " pull-right";
    }

    var disabled = false;
    if (this.props.enabled === false) {
      disabled = true;
    }

    return <button onClick={e => this.props.onClick(e)} className={cn} disabled={disabled}>{ic}{this.props.text}{this.props.children}</button>
  }
}

export class NavGroup extends React.PureComponent {
  render() {
    return (
      <div className="nav-group">{this.props.children}</div>
    )
  }
}

export class NavTitle extends React.PureComponent<{ title: string }, any> {
  render() {
    return (
      <h5 className="nav-group-title">{this.props.title}</h5>
    )
  }
}

export class NavItem extends React.PureComponent<{ icon?: string, text?: string, onClick?: (e: any) => void, active?: boolean }, any>{
  render() {
    var ic;
    if (this.props.icon) {
      ic = <Icon i={this.props.icon} />;
    }

    var cn = "nav-group-item";
    if (this.props.active) {
      cn += " active";
    }

    return (
      <span className={cn} onClick={this.props.onClick}>
        {ic}{this.props.text}
        {this.props.children}
      </span>
    )
  }
}

export interface SelectItem {
  label: string
  value: string
}

export class SelectBox extends React.Component<{ value: string, items: SelectItem[], onChange?: (e: any) => void }>{
  render() {
    var options = this.props.items.map(i => <option key={i.value} value={i.value}>{i.label}</option>)
    return (
      <select className="form-control" value={this.props.value} onChange={this.props.onChange}>
        {options}
      </select>
    )
  }
}
