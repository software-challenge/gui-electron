import * as React from 'react'
import { render } from 'react-dom'
import { App }    from './App'
import { Api }    from '../api/Api'
import * as path  from 'path'

const loadedCSS: string[] = []

export function loadCSS(filename: string) {
  if (loadedCSS.indexOf(filename) == -1) {
    const ln = document.createElement('link')
    ln.setAttribute('rel', 'stylesheet')
    ln.setAttribute('href', filename)
    document.head.appendChild(ln)
    loadedCSS.push(filename)
  }
}


export function main() {
  let location = decodeURIComponent(window.location.search.substring('?dirname='.length))
  let dir = window.localStorage['logDir']
  process.env.SGC_LOG_PATH = dir ? (dir[0] == '.' ? path.join(location, dir) : dir) : location

  //Preload viewer:
  Api.getViewer()

  window.addEventListener('beforeunload', () => {
    Api.stop()
  })
  render(
    <App/>,
    document.getElementById('root'),
  )
  loadCSS('css/main.css')
}