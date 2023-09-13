import React, { useTransition } from "react";
import styled from "styled-components";
import useWindowSize from "../hooks/useWindowSize";
import { SMALL_SCREEN_WIDTH } from "../constants";
import { Region } from "../KesApi";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

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

export function RegionPageNav( { activeRegion }: {activeRegion : Region}) {
    const windowSize = useWindowSize();
    const {t} = useTranslation();

    return <NavItems className="nav-links">
        {windowSize.width > SMALL_SCREEN_WIDTH ? 
        activeRegion.properties.rp_region.map(rp =>
            <NavItem key={rp.slug}>
                <Link to={'/r/'+activeRegion.properties.slug+'/'+rp.slug}>
                    {t('region.'+activeRegion.properties.slug+'.'+rp.slug+'.title')}
                </Link>
            </NavItem>)
        : <NavItem><button className="btn">==</button></NavItem>}
        </NavItems>
}