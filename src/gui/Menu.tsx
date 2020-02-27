import * as React                                             from 'react'
import { render }                                             from 'react-dom'
import { ListGroup, ListGroupItem, Nav, Navbar, NavbarBrand } from 'react-bootstrap'
import { AppContent }                                         from './App'


export class Menu extends React.Component<any, any> {

  public render() {
    return (
      <div className={'sidebar'}>
        <ListGroup>
          <ListGroupItem action onClick={() => this.props.app(AppContent.Administration)}>
            Ha GAAAY!
          </ListGroupItem>
        </ListGroup>
      </div>
    )
  }
}

/**

 <Nav id="sidebar">
 <div id="dismiss">
 <i class="fas fa-arrow-left"></i>
 </div>
 <div class="sidebar-header">
 <h3>Software-Challenge Germany</h3>
 </div>

 <ul class="list-unstyled components">
 <p>Dummy Heading</p>
 <li class="active">
 <a href="#homeSubmenu" data-toggle="collapse" aria-expanded="false">Home</a>
 <ul className="collapse list-unstyled" id="homeSubmenu">
 {games.map(
  t => (<li key={t.id} onClick={() => this.showGame(t.id)}
          active={this.state.contentState == AppContent.GameLive && this.state.activeGameId == t.id}>
    <UnicodeIcon icon="🎳"/>{t.name} ({t.id})
    <span className="close-button-container">
 <button title="Close Game" className="svg-button close-game" onClick={e => {
   this.closeGame(t.id)
   e.stopPropagation()
 }}>
 <img className="svg-icon" src={'resources/x-circled.svg'} alt={'Close Game'}/></button></span></li>
                        ))}
 </ul>
 </li>
 </ul>
 </Nav>
 **/
