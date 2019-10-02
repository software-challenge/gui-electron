import { UnicodeIcon } from '../generic-components/Components'
import * as React      from 'react'

export function NavGroup(props) {
  return <div className='nav-group'>{props.children}</div>
}

export function NavTitle(props: { title: string }) {
  return <h5 className='nav-group-title'>{props.title}</h5>
}

export function NavItem(props: { icon?: string, text?: string, onClick?: (e: any) => void, active?: boolean, children?: any }) {
  let ic
  if (props.icon) {
    ic = <UnicodeIcon icon={props.icon}/>
  }

  let cn = 'nav-group-item'
  if (props.active) {
    cn += ' active'
  }

  return <span className={cn} onClick={props.onClick}>
        {ic}{props.text}
    {props.children}
      </span>
}
