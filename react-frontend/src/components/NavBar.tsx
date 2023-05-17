import React, { useState } from 'react';
import styled from 'styled-components';
import { SMALL_SCREEN_WIDTH } from '../constants';
import useWindowSize from '../hooks/useWindowSize';
import { Language, Region } from '../KesApi';
import LanguageSelector from './LanguageSelector';
import i18next from 'i18next';
import { Link } from 'react-router-dom';

const NavRight = styled.div`
    display: flex;
    flex-direction: row;
    flex: 1;
    justify-content: flex-end;
    align-items: center;
`;

const NavItem = styled.li`
    display: inline;
    padding: 1rem;
    // border-left: 1px solid grey;
    height: 100%;
    line-height: 100%;
`;

const NavItems = styled.ul`
    display: flex;
    flex-direction: row;
    align-items: center;
    list-style: none;
    height: 100%;
    margin: 0;

`;

type PropTypes = {
    languages:Language[];
}

const NavBar = ( { languages }: PropTypes) => {
    const [language, setLanguage] = useState(i18next.language);
    const windowSize = useWindowSize();
    return ( 
    <nav className="navbar border-primary d-flex flex-row align-items-center bg-white">
        <Link to="/"><img id="logo" src="/sk-logotype-topbar.png"/></Link>
        <div id="sk-title">Smartakartan <a href="/gitver">4.0</a> /
        </div>
        <NavRight>

        <NavItems className="nav-links">
            {windowSize.width > SMALL_SCREEN_WIDTH ? 
            <>
            <NavItem><a href="#"><span>AAAAAA</span></a></NavItem>
            <NavItem>
                <a href="#"><span>BBBBBB</span></a>
            </NavItem>
            <NavItem>
                <a href="#"><span>Om oss (i)</span></a>
            </NavItem>
            </>
            : null
            }
            <NavItem><button className="btn">==</button></NavItem>
        </NavItems>
        <div id="languageSelector">
            <LanguageSelector
                handleSelectChange={(e) => {i18next.changeLanguage(e.target.value); setLanguage(e.target.value);}}
                value={language}
                languages={languages}
                />
        </div>
        </NavRight>
    </nav>)
    
}

export default NavBar;