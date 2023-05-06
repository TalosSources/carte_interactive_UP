import React from 'react';
import RegionSelector from './RegionSelector';
import styled from 'styled-components';
import { SMALL_SCREEN_WIDTH } from '../constants';
import useWindowSize from '../hooks/useWindowSize';
import { Language, Region } from '../KesApi';
import LanguageSelector from './LanguageSelector';
import i18next from 'i18next';

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
    handleRegionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    activeRegionSlug: string;
    regionList: Region[];
    languages:Language[];
}

const NavBar = ( { handleRegionChange, activeRegionSlug, regionList, languages }: PropTypes) => {

    const windowSize = useWindowSize();
    return ( 
    <nav className="border-bottom border-bottom-5 border-primary d-flex flex-row align-items-center bg-white">
        <img id="logo" src="/sk-logotype-topbar.png"/>
        <div id="sk-title">Smartakartan <a href="/gitver">4.0</a> /
        </div>
        { windowSize.width > SMALL_SCREEN_WIDTH && 
        <div id="regionSelector">
            <RegionSelector
                handleSelectChange={handleRegionChange}
                value={activeRegionSlug}
                regionList={regionList}
                />
        </div>
        }
        <div id="languageSelector">
            <LanguageSelector
                handleSelectChange={(e) => i18next.changeLanguage(e.target.value)}
                value={i18next.language}
                languages={languages}
                />
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
        </NavRight>
    </nav>)
    
}

export default NavBar;