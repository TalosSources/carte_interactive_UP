import React from 'react';
import RegionSelector from '../RegionSelector';
import styled from 'styled-components';

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




const NavBar = ( { handleRegionChange, activeRegionSlug, regionList } ) => {
    return ( 
    <nav className="border-bottom border-bottom-2 border-bottom-danger d-flex flex-row align-items-center">
        <img id="logo" src="/sk-logotype-topbar.png"/>
        <div id="sk-title">Smartakartan <a href="/gitver">4.0</a> /
        </div>
        <div id="regionSelector">
            <RegionSelector
                handleSelectChange={handleRegionChange}
                value={activeRegionSlug}
                regionList={regionList}
            />
        </div>
        <NavRight>

        <NavItems className="nav-links">
            <NavItem><a href="#"><span>AAAAAA</span></a></NavItem>
            <NavItem>
                <a href="#"><span>BBBBBB</span></a>
            </NavItem>
            <NavItem>
                <a href="#"><span>Om oss (i)</span></a>
            </NavItem>
            <NavItem id="burger-menu">==</NavItem>
        </NavItems>
        </NavRight>
    </nav>)
    
}

export default NavBar;