import { useRef, useState } from 'react'
import type { StayDates } from '../types'
import { getDateError, todayString } from '../lib/stays'
import { Icon } from './Icon'

interface SearchBarProps {
  destination: string
  guests: number
  dates: StayDates
  onDestination: (value: string) => void
  onGuests: (value: number) => void
  onDates: (value: StayDates) => void
  onSearch: () => void
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'))
}

export function SearchBar({ destination, guests, dates, onDestination, onGuests, onDates, onSearch }: SearchBarProps) {
  const dateDialog = useRef<HTMLDialogElement>(null)
  const [showError, setShowError] = useState(false)
  const [pendingDates, setPendingDates] = useState<StayDates>({ ...dates })
  const dateError = getDateError(pendingDates.checkIn, pendingDates.checkOut)
  const searchDateError = getDateError(dates.checkIn, dates.checkOut)
  const dateSummary = dates.checkIn && dates.checkOut && !searchDateError
    ? shortDate(dates.checkIn) + ' – ' + shortDate(dates.checkOut)
    : 'Add dates'

  function openDates() {
    setPendingDates({ ...dates })
    setShowError(false)
    dateDialog.current?.showModal()
  }

  return <div className="search-area">
    <form className="search-bar" aria-label="Search demo homes" onSubmit={(event) => {
      event.preventDefault()
      setShowError(true)
      if (searchDateError) {
        setPendingDates({ ...dates })
        dateDialog.current?.showModal()
        return
      }
      onSearch()
    }}>
      <label className="search-destination">
        <span>Where</span>
        <input aria-label="Destination" placeholder="Search destinations" list="destination-suggestions" value={destination} maxLength={100} onChange={(event) => onDestination(event.target.value)} />
        <datalist id="destination-suggestions"><option value="Cape Town" /><option value="Johannesburg" /><option value="Durban" /><option value="Western Cape" /><option value="KwaZulu-Natal" /><option value="Gauteng" /></datalist>
      </label>
      <button type="button" className="search-dates" aria-label={'Choose dates: ' + dateSummary} onClick={openDates}>
        <span>When</span><span className={dateSummary === 'Add dates' ? 'placeholder' : ''}>{dateSummary}</span>
      </button>
      <label className="search-guests">
        <span>Who</span>
        <select aria-label="Number of guests" value={guests} onChange={(event) => onGuests(Number(event.target.value))}>
          <option value={1}>Add guests</option>
          {Array.from({ length: 15 }, (_, index) => <option value={index + 2} key={index + 2}>{index + 2} guests</option>)}
        </select>
      </label>
      <button type="submit" className="search-submit" aria-label="Search stays"><Icon name="search" size={20} /><span className="search-submit-label">Search</span></button>
    </form>
    <p className="demo-note"><span className="demo-dot" />Independent frontend demo · Fictional homes · No live availability</p>
    <dialog ref={dateDialog} className="info-dialog dates-dialog" aria-labelledby="dates-title">
      <div className="dialog-heading"><h2 id="dates-title">When’s your getaway?</h2><button type="button" className="round-button" aria-label="Close dates" onClick={() => dateDialog.current?.close()}><Icon name="close" size={18} /></button></div>
      <p>Pick 1–30 nights to compare demo estimates. Dates do not check or reserve availability.</p>
      <div className="date-fields">
        <label>CHECK-IN<input type="date" aria-label="Search check-in" min={todayString()} value={pendingDates.checkIn} onChange={(event) => setPendingDates({ ...pendingDates, checkIn: event.target.value })} /></label>
        <label>CHECKOUT<input type="date" aria-label="Search checkout" min={pendingDates.checkIn || todayString()} value={pendingDates.checkOut} onChange={(event) => setPendingDates({ ...pendingDates, checkOut: event.target.value })} /></label>
      </div>
      {showError && dateError && <p className="date-error" role="alert">{dateError}</p>}
      <div className="dialog-actions"><button className="text-button" onClick={() => { setPendingDates({ checkIn: '', checkOut: '' }); setShowError(false) }}>Clear dates</button><button className="dark-button" onClick={() => { setShowError(true); if (!dateError) { onDates({ ...pendingDates }); dateDialog.current?.close() } }}>Apply dates</button></div>
    </dialog>
  </div>
}
