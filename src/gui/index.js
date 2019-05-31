import React from 'react'
import { render } from 'react-dom'
import { App } from './App'
import { Api } from '../api/Api'
import * as path from 'path'

let loadedCSS = []

export function loadCSS(filename) {
  if(loadedCSS.indexOf(filename) == -1) {
    const ln = document.createElement('link')
    ln.setAttribute('rel', 'stylesheet')
    ln.setAttribute('href', filename)
    document.head.appendChild(ln)
    loadedCSS.push(filename)
  }
}


console.log('window.location.search=', window.location.search)
let location = decodeURIComponent(window.location.search.substring('?dirname='.length))
let dir = window.localStorage['logDir']
process.env.SGC_LOG_PATH = !dir ? location : dir[0] == '.' ? path.join(location, dir) : dir

//Preload viewer:
Api.getViewer()

window.addEventListener('beforeunload', () => {
  Api.stop()
})
render(
  <App/>,
  document.getElementById('app'),
  )
loadCSS('css/main.css')
