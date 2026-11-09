import { useEffect, useRef, useState } from 'react'
import type { Category, Filters, SortOrder, StayDates } from './types'
import { categories, defaultFilters, stays } from './data/stays'
import { filterStays, formatPrice, getDateError, getNights, groupStaysByProvince, parseSavedIds } from './lib/stays'
import { Header } from './components/Header'
import { Icon } from './components/Icon'
import type { IconName } from './components/Icon'
import { PropertyCard } from './components/PropertyCard'
import { PropertySection } from './components/PropertySection'
import { SearchBar } from './components/SearchBar'
import { StayDetails } from './components/StayDetails'
import { AiSearch } from './components/AiSearch'
import { criteriaToFilters } from './lib/ai'

const STORAGE_KEY = 'staybnb:saved-stays:v1'
const categoryIcons: Record<Category, IconName> = {
  'All stays': 'home', Coastal: 'waves', Cabins: 'tree',
  'City escapes': 'city', Countryside: 'sun', 'Unique stays': 'spark',
}
const collections = groupStaysByProvince(stays)
const emptyDates: StayDates = { checkIn: '', checkOut: '' }

function readSaved() {
  try {
    return parseSavedIds(localStorage.getItem(STORAGE_KEY), stays.map((stay) => stay.id))
  } catch {
    return []
  }
}

export default function App() {
  const [route, setRoute] = useState(window.location.hash || '#/')
  const [filters, setFilters] = useState<Filters>({ ...defaultFilters })
  const [destination, setDestination] = useState('')
  const [guests, setGuests] = useState(1)
  const [dates, setDates] = useState<StayDates>({ ...emptyDates })
  const [appliedDates, setAppliedDates] = useState<StayDates>({ ...emptyDates })
  const [savedIds, setSavedIds] = useState<string[]>(readSaved)
  const [showFilters, setShowFilters] = useState(false)
  const [notice, setNotice] = useState('')
  const resultsRef = useRef<HTMLElement>(null)
  const results = filterStays(stays, filters, savedIds)
  const selectedStay = stays.find((stay) => route === '#/stay/' + stay.id)
  const homeRoute = route === '#/' || route === '#'
  const nights = getDateError(appliedDates.checkIn, appliedDates.checkOut) ? null : getNights(appliedDates.checkIn, appliedDates.checkOut)
  const hasFilters = Boolean(filters.destination || filters.guests > 1 || filters.maxPrice !== defaultFilters.maxPrice
    || filters.category !== 'All stays' || filters.savedOnly || filters.sort !== 'recommended')

  useEffect(() => {
    function navigate() {
      setRoute(window.location.hash || '#/')
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    window.addEventListener('hashchange', navigate)
    return () => window.removeEventListener('hashchange', navigate)
  }, [])

  useEffect(() => {
    document.title = selectedStay ? selectedStay.name + ' — Airbnb Clone' : 'Airbnb Clone — Find your next stay'
  }, [selectedStay])

  function scrollToResults() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resultsRef.current?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' })
  }

  function toggleSaved(id: string) {
    const next = savedIds.includes(id) ? savedIds.filter((saved) => saved !== id) : [...savedIds, id]
    setSavedIds(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setNotice('')
    } catch {
      setNotice('Your browser could not save favourites. They will stay available until you close or reload this page.')
    }
  }

  function showBrowse(savedOnly: boolean) {
    setFilters((current) => ({ ...current, savedOnly }))
    window.location.assign('#/')
    if (homeRoute) scrollToResults()
  }

  function clearFilters() {
    setFilters({ ...defaultFilters, savedOnly: filters.savedOnly })
    setDestination('')
    setGuests(1)
    setDates({ ...emptyDates })
    setAppliedDates({ ...emptyDates })
  }

  function showCollection(province: string) {
    setFilters({ ...defaultFilters, destination: province })
    setDestination(province)
    setGuests(1)
    scrollToResults()
  }

  return <>
    <a className="skip-link" href="#main-content" onClick={(event) => {
      event.preventDefault()
      const main = document.getElementById('main-content')
      main?.setAttribute('tabindex', '-1')
      main?.focus()
      main?.scrollIntoView()
    }}>Skip to content</a>

    <div className="discovery-header">
      <Header savedCount={savedIds.length} savedOnly={homeRoute && filters.savedOnly} onSaved={() => showBrowse(true)} onExplore={() => showBrowse(false)} />
      {homeRoute && <SearchBar destination={destination} guests={guests} dates={dates}
        onDestination={setDestination} onGuests={setGuests} onDates={setDates}
        onSearch={() => {
          setFilters((current) => ({ ...current, destination, guests }))
          setAppliedDates({ ...dates })
          scrollToResults()
        }} />}
    </div>
    {notice && <p className="storage-notice page-width" role="status">{notice}</p>}

    {homeRoute ? <main id="main-content" className="page-width browse-page" ref={resultsRef}>
      <h1 className="sr-only">Find your next stay in South Africa</h1>
      <AiSearch onApply={(criteria) => {
        const next = criteriaToFilters(criteria)
        setFilters(next)
        setDestination(next.destination)
        setGuests(next.guests)
        scrollToResults()
      }} />
      <div className="category-toolbar">
        <div className="category-list" role="group" aria-label="Stay category">
          {categories.map((category) => <button key={category} aria-pressed={filters.category === category}
            className={'category-button ' + (filters.category === category ? 'selected' : '')}
            onClick={() => setFilters((current) => ({ ...current, category }))}>
            <Icon name={categoryIcons[category]} size={21} />{category}
          </button>)}
        </div>
        <button className={'filter-toggle ' + (showFilters ? 'active' : '')} aria-expanded={showFilters}
          aria-controls="price-filters" onClick={() => setShowFilters(!showFilters)}>
          <Icon name="sliders" size={17} />Filters{filters.maxPrice !== defaultFilters.maxPrice && <span className="filter-indicator" />}
        </button>
      </div>
      {showFilters && <div className="filter-panel" id="price-filters">
        <label htmlFor="max-price">Maximum nightly price<strong>{formatPrice(filters.maxPrice)}</strong>
          <input id="max-price" type="range" min="0" max={Math.max(3500, filters.maxPrice)} step="1" value={filters.maxPrice}
            onChange={(event) => setFilters((current) => ({ ...current, maxPrice: Number(event.target.value) }))} />
        </label>
        <p>Budget filters use the nightly rate, before example cleaning and service fees.</p>
        <button className="text-button" onClick={clearFilters}>Reset filters</button>
      </div>}
      <div className="results-toolbar">
        <p aria-live="polite"><strong>{results.length} {results.length === 1 ? 'home' : 'homes'}</strong>
          {filters.destination ? ' in “' + filters.destination + '”' : ' · Demo collection'}
          {nights ? ' · Estimates for ' + nights + ' night' + (nights !== 1 ? 's' : '') + ', including example fees' : ''}
        </p>
        <div className="results-actions">
          <button className={'saved-toggle ' + (filters.savedOnly ? 'active' : '')} aria-pressed={filters.savedOnly}
            onClick={() => setFilters((current) => ({ ...current, savedOnly: !current.savedOnly }))}>
            <Icon name="heart" size={15} filled={filters.savedOnly} />Saved<span className="saved-count">{savedIds.length}</span>
          </button>
          <label><span className="sort-label">Sort:</span><select aria-label="Sort stays" value={filters.sort}
            onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as SortOrder }))}>
            <option value="recommended">Recommended</option><option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option><option value="rating">Highest rated</option>
          </select></label>
        </div>
      </div>

      {!hasFilters ? collections.map((collection) => <PropertySection key={collection.province} {...collection}
        savedIds={savedIds} nights={nights} onSave={toggleSaved} onSeeAll={showCollection} />)
        : results.length > 0 ? <section className="filtered-section" aria-labelledby="results-heading">
          <div className="section-heading"><h2 id="results-heading">{filters.savedOnly ? 'Your saved homes' : filters.destination ? 'Stays in ' + filters.destination : 'Homes for your next getaway'}</h2>
            <button className="text-button" onClick={clearFilters}>Clear filters</button>
          </div>
          <div className="property-grid">{results.map((stay) => <PropertyCard key={stay.id} stay={stay}
            saved={savedIds.includes(stay.id)} onSave={toggleSaved} nights={nights} />)}</div>
        </section> : <section className="empty-state" aria-labelledby="empty-heading">
          <span className="empty-icon"><Icon name={filters.savedOnly ? 'heart' : 'search'} size={29} /></span>
          <h2 id="empty-heading">{filters.savedOnly && savedIds.length === 0 ? 'Save a little inspiration' : 'No homes match your search'}</h2>
          <p>{filters.savedOnly && savedIds.length === 0 ? 'Tap the heart on any home to start your wishlist.' : 'Try another destination, fewer guests, or a higher nightly budget.'}</p>
          <button className="dark-button" onClick={filters.savedOnly && savedIds.length === 0 ? () => showBrowse(false) : clearFilters}>
            {filters.savedOnly && savedIds.length === 0 ? 'Explore homes' : 'Clear search and filters'}
          </button>
          {filters.savedOnly && savedIds.length > 0 && <button className="text-button" onClick={() => showBrowse(false)}>Browse all homes</button>}
        </section>}
      <p className="listing-disclaimer">Portfolio demo: all homes, hosts, prices, ratings, and reviews are fictional. Photos are illustrative.</p>
    </main> : selectedStay ? <StayDetails key={selectedStay.id} stay={selectedStay} saved={savedIds.includes(selectedStay.id)}
      onSave={toggleSaved} initialDates={appliedDates} initialGuests={filters.guests} />
      : route === '#/about' ? <main id="main-content" className="page-width about-page">
        <span className="demo-pill">FRONTEND PORTFOLIO</span>
        <h1>A familiar way to find<br />somewhere new.</h1>
        <p>Airbnb Clone is an independent learning project inspired by Airbnb, built with React, TypeScript, and Tailwind CSS, using a fictional South African collection.</p>
        <p>This project is not affiliated with Airbnb. There are no real accounts, reservations, payments, or live availability checks. The optional Gemini finder sends your description to Google only when enabled and submitted. Experiences and services are not implemented.</p>
        <a href="#/" className="primary-button">Explore homes<Icon name="arrow" size={18} /></a>
      </main> : <main id="main-content" className="page-width empty-state">
        <h1>This home couldn’t be found.</h1><p>That page isn’t part of our demo collection.</p>
        <a href="#/" className="primary-button">Back to homes<Icon name="arrow" size={18} /></a>
      </main>}

    <footer className="site-footer">
      <div className="page-width footer-discovery">
        <h2>Inspiration for your next getaway</h2>
        <div className="footer-destinations">{['Cape Town', 'Johannesburg', 'Durban', 'Ballito', 'Knysna', 'Franschhoek'].map((city) =>
          <button key={city} onClick={() => { showCollection(city); window.location.assign('#/') }}><strong>{city}</strong><span>Explore demo homes</span></button>)}
        </div>
      </div>
      <div className="page-width footer-bottom">
        <p>© {new Date().getFullYear()} Airbnb Clone · Independent portfolio demo · Not affiliated with Airbnb</p>
        <div><a href="#/about">About this demo</a><span><Icon name="globe" size={15} />English (ZA)</span><strong>R ZAR</strong></div>
      </div>
    </footer>
    <nav className="mobile-tabs" aria-label="Mobile navigation">
      <button className={homeRoute && !filters.savedOnly ? 'active' : ''} onClick={() => showBrowse(false)}><Icon name="search" size={21} />Explore</button>
      <button className={homeRoute && filters.savedOnly ? 'active' : ''} onClick={() => showBrowse(true)}><Icon name="heart" size={21} />Saved</button>
      <a className={route === '#/about' ? 'active' : ''} href="#/about"><Icon name="shield" size={21} />About</a>
    </nav>
  </>
}
