import React, { useContext, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { type Language, fetchLanguages } from '../lib/KesApi'
import LanguageSelector from './LanguageSelector'
import i18next, { t } from 'i18next'
import { Link } from 'react-router-dom'
import useWindowSize from '../hooks/useWindowSize'
import { slide as Menu } from 'react-burger-menu'
import { RegionContext } from './RegionContext'

const NavRight = styled.div`
    display: flex;
    flex-direction: row;
    flex: 1;
    justify-content: flex-end;
    align-items: center;
`

const NavItem = styled.li`
    display: inline;
    padding: 1rem;
    // border-left: 1px solid grey;
    height: 100%;
    line-height: 100%;
`

const NavItems = styled.ul`
    display: flex;
    flex-direction: row;
    align-items: center;
    list-style: none;
    height: 100%;
    margin: 0;

`
const styles = {
  bmBurgerButton: {
    position: 'relative',
    width: '36px',
    height: '30px',
    marginRight: '0.5em',
    marginLeft: '-2em'
    //    right: '36px',
    //    top: '36px'
  },
  bmBurgerBars: {
    background: '#373a47'
  },
  bmBurgerBarsHover: {
    background: '#a90000'
  },
  bmCrossButton: {
    height: '24px',
    width: '24px'
  },
  bmCross: {
    background: '#bdc3c7'
  },
  bmMenuWrap: {
    position: 'fixed',
    height: '100%',
    top: '0em'
  },
  bmMenu: {
    background: '#373a47',
    padding: '2.5em 1.5em 0',
    fontSize: '1.15em'
  },
  // bmMorphShape: {
  //    fill: '#373a47'
  // },
  bmItemList: {
    color: '#b8b7ad',
    padding: '0.8em'
  },
  bmItem: {
    // display: 'inline-block'
    color: 'white'
  },
  bmOverlay: {
    background: 'rgba(0, 0, 0, 0.3)',
    position: 'fixed',
    top: '0px',
    left: '0px',
    width: '100vw',
    height: '100vh',
    zIndex: '1002'
  },
  navLinks: {
    padding: '0em'
  }
}

function NavBar (): React.JSX.Element {
  const windowSize = useWindowSize()

  const logoTitleRefContainer = useRef<HTMLDivElement | null>(null)
  const [logoTitleWidth, setLogoTitleWidth] = useState<number | null>(null)
  const languageSelectorRef = useRef<HTMLDivElement | null>(null)
  const [languageSelectorWidth, setLanguageSelectorWidth] = useState<number | null>(null)
  const navbarRef = useRef<HTMLDivElement | null>(null)
  const [navbarWidth, setNavbarWidth] = useState<number | null>(null)
  const regionPageContainer = useRef<HTMLDivElement | null>(null)
  const [regionPageContainerWidth, setRegioPageContainerWidth] = useState<number>(0)

  const [fold, setFold] = useState(false)
  const [availableSpace, setAvailableSpace] = useState(0)
  const [language, setLanguage] = useState(i18next.language)

  const activeRegion = useContext(RegionContext)

  useEffect(() => {
    let availableSpaceForPages = windowSize.width
    if (navbarWidth != null) {
      availableSpaceForPages = navbarWidth
    }
    if (logoTitleWidth != null) {
      availableSpaceForPages -= logoTitleWidth
    }
    if (languageSelectorWidth != null) {
      availableSpaceForPages -= languageSelectorWidth
    }
    setAvailableSpace(availableSpaceForPages)
  })
  useEffect(() => {
    if (logoTitleRefContainer.current != null) {
      setLogoTitleWidth(logoTitleRefContainer.current.offsetWidth)
    }
    if (languageSelectorRef.current != null) {
      setLanguageSelectorWidth(languageSelectorRef.current.offsetWidth)
    }
    if (navbarRef.current != null) {
      setNavbarWidth(navbarRef.current.offsetWidth)
    }
  }, [windowSize])
  useEffect(() => {
    if ((regionPageContainer.current != null) && !fold) {
      setRegioPageContainerWidth(regionPageContainer.current.offsetWidth) // or clientWidth?
    }
  }, [fold, language, activeRegion])
  useEffect(() => {
    let newFold = true
    if (regionPageContainerWidth <= availableSpace) {
      newFold = false
    }
    if (newFold !== fold) {
      setFold(newFold)
    }
  }, [regionPageContainerWidth, availableSpace])

  const [languages, setLanguages] = useState<Language[]>([])
  useEffect(() => {
    fetchLanguages()
      .then(l => { setLanguages(l) })
      .catch(() => {
        console.log('Failure while fetching languages.')
      })
  }, [])
  return (
    <div ref={navbarRef}>
    <nav className="navbar border-primary d-flex flex-row align-items-center bg-white">
        <div ref={logoTitleRefContainer}>
        <Link to={typeof activeRegion !== 'undefined' ? ('/r/' + activeRegion.properties.slug) : ''}>
            <img id="logo" src="/sk-logotype-topbar.png"/>
        </Link>

        <div id="sk-title">Smartakartan</div></div>

        <NavRight>
            <div ref={regionPageContainer}><NavItems className="nav-links">
                    { !fold
                      ? <> {activeRegion?.properties.rp_region.map(rp =>
                            <NavItem key={rp.slug}>
                                <Link to={'/r/' + activeRegion.properties.slug + '/' + rp.slug}>
                                    {t('region.' + activeRegion.properties.slug + '.' + rp.slug + '.title')}
                                </Link>
                            </NavItem>)}
                            <div ref={languageSelectorRef}>
                                <LanguageSelector
                                    handleSelectChange={(e) => {
                                      i18next
                                        .changeLanguage(e.target.value)
                                        .catch(() => {
                                          console.log('Failure while changing language.')
                                        })
                                      setLanguage(e.target.value)
                                    }}
                                    value={language}
                                    languages={languages}
                            /></div></>
                      // NOTE: You also need to provide styles, see https://github.com/negomi/react-burger-menu#styling
                      : <Menu id="burger-menu" right styles={ styles }>
                        {activeRegion?.properties.rp_region.map(rp =>
                                <Link key={'/r/' + activeRegion.properties.slug + '/' + rp.slug} className="menu-item" to={'/r/' + activeRegion.properties.slug + '/' + rp.slug}>
                                    {t('region.' + activeRegion.properties.slug + '.' + rp.slug + '.title')}
                                </Link>)}
                                <div id="languageVSpacer"/>
                                <div ref={languageSelectorRef}>
                                    <LanguageSelector
                                        handleSelectChange={(e) => {
                                          i18next
                                            .changeLanguage(e.target.value)
                                            .catch(() => {
                                              console.log('Failure while changing language.')
                                            })
                                          setLanguage(e.target.value)
                                        }
                                        }
                                        value={language}
                                        languages={languages}
                                /></div>
                    </Menu> }
                    </NavItems></div>
        </NavRight>
    </nav></div>)
}

export default NavBar
