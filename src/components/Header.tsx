import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

interface HeaderProps {
  savedCount: number
  savedOnly: boolean
  onSaved: () => void
  onExplore: () => void
}

export function Header({ savedCount, savedOnly, onSaved, onExplore }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dialogContent, setDialogContent] = useState<'host' | 'region'>('host')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function dismiss(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape)
    }
  }, [menuOpen])

  function openDialog(content: 'host' | 'region') {
    setDialogContent(content)
    dialogRef.current?.showModal()
  }

  return <header className="site-header">
    <div className="page-width header-inner">
      <a className="brand" href="#/" aria-label="Airbnb Clone home">
        <span className="brand-icon"><Icon name="home" size={30} /></span>airbnb<span className="brand-demo-label">clone</span>
      </a>
      <nav className="primary-nav" aria-label="Main navigation">
        <button className={'nav-item ' + (!savedOnly ? 'nav-active' : '')} onClick={onExplore}>
          <span className="nav-illustration home-illustration"><Icon name="home" size={29} /></span><span>Homes</span>
        </button>
        <button className="nav-item coming-soon" disabled title="Experiences are not available in this frontend demo">
          <span className="nav-illustration experience-illustration"><Icon name="coffee" size={27} /></span><span>Experiences<small>Coming soon</small></span>
        </button>
        <button className="nav-item coming-soon" disabled title="Services are not available in this frontend demo">
          <span className="nav-illustration service-illustration"><Icon name="bell" size={28} /></span><span>Services<small>Coming soon</small></span>
        </button>
      </nav>
      <div className="header-actions">
        <button className="host-link" onClick={() => openDialog('host')}>Become a host</button>
        <button className="round-button region-button" aria-label="Language and currency" onClick={() => openDialog('region')}><Icon name="globe" size={19} /></button>
        <div className="menu-wrap" ref={menuRef}>
          <button ref={menuButtonRef} className="round-button" aria-label="Open navigation menu" aria-expanded={menuOpen} aria-controls="navigation-menu" onClick={() => setMenuOpen(!menuOpen)}><Icon name="menu" size={18} /></button>
          {menuOpen && <div className="navigation-menu" id="navigation-menu">
            <button onClick={() => { onExplore(); setMenuOpen(false) }}><Icon name="home" size={18} />Explore homes</button>
            <button onClick={() => { onSaved(); setMenuOpen(false) }}><Icon name="heart" size={18} />Saved stays<span className="saved-count">{savedCount}</span></button>
            <a href="#/about" onClick={() => setMenuOpen(false)}><Icon name="shield" size={18} />About this demo</a>
            <p>No accounts or real reservations.</p>
          </div>}
        </div>
      </div>
    </div>
    <dialog ref={dialogRef} className="info-dialog" aria-labelledby="info-dialog-title">
      <div className="dialog-heading"><h2 id="info-dialog-title">{dialogContent === 'host' ? 'A home for your next idea' : 'Language and currency'}</h2><button className="round-button" aria-label="Close information" onClick={() => dialogRef.current?.close()}><Icon name="close" size={18} /></button></div>
      {dialogContent === 'host' ? <><p>This is a frontend portfolio demo. Hosting, accounts, and real reservations aren’t available.</p><p>For now, explore the fictional collection and save your favourite stays.</p></> : <><div className="region-option"><Icon name="globe" /><div><strong>English · South Africa</strong><span>South African rand — ZAR (R)</span></div><Icon name="check" /></div><p>This demo uses one language and currency. No settings or exchange rates are changed.</p></>}
      <button className="primary-button" onClick={() => dialogRef.current?.close()}>Got it</button>
    </dialog>
  </header>
}
