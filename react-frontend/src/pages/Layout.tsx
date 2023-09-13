import React  from 'react';
import { Outlet, Link } from "react-router-dom";
import { Region } from '../KesApi';
import NavBar from '../components/NavBar';
import styled from 'styled-components';
import { SKFooter } from '../components/Footer';


export function Layout({regions, regionSlug} : {regions:Region[], regionSlug:string}) {
    let activeRegion = regions.filter(r => r.properties.slug==regionSlug)[0]
    if (regions.length === 0) {
        activeRegion = {properties: {
            slug:"",
            title:"",
            welcome_message_html: '',
            rp_region: [ ],
        },}
    }
    return (
        <>
        <div className="container">
            <nav>
                <NavBar activeRegion={activeRegion} />
            </nav>

            <Outlet />

            <SKFooter regions={regions}/>
        </div>
        </>
    );
}

