import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Language, Region, fetchLanguages } from '../KesApi';
import LanguageSelector from './LanguageSelector';
import i18next, { t } from 'i18next';
import { Link } from 'react-router-dom';
import { RegionPageNav } from './RegionPageNav';

const NavRight = styled.div`
    display: flex;
    flex-direction: row;
    flex: 1;
    justify-content: flex-end;
    align-items: center;
`;

const NavBar = ( { activeRegion }: {activeRegion : Region}) => {
    const [language, setLanguage] = useState(i18next.language);
    const [languages, setLanguages] = useState<Language[]>([]);
    useEffect(() => {
        fetchLanguages().then(l => setLanguages(l));
    }, []);
    return ( 
    <nav className="navbar border-primary d-flex flex-row align-items-center bg-white">
        <Link to="/">
            <img id="logo" src="/sk-logotype-topbar.png"/>
        </Link>
        
        <div id="sk-title">Smartakartan</div>

        <NavRight>
            <RegionPageNav activeRegion={activeRegion}/>
            <LanguageSelector
                handleSelectChange={(e) => {i18next.changeLanguage(e.target.value); setLanguage(e.target.value);}}
                value={language}
                languages={languages}
                />
        </NavRight>
    </nav>)
    
}

export default NavBar;