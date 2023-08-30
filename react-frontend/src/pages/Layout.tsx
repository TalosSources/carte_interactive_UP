import React  from 'react';
import { Outlet, Link } from "react-router-dom";
import { Region } from '../KesApi';
import NavBar from '../components/NavBar';
import styled from 'styled-components';

const Footer = styled.div`
    padding-top: 2rem;
`

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
            <NavBar
                activeRegion={activeRegion}
            />
            </nav>

            <Outlet />

            <Footer className="row footer ng-scope pt-10" ng-controller="Footer">
                <div className="col-lg-offset-3 col-xs-6 col-sm-3 col-md-offset-1 col-md-3 col-lg-3 company">
                    <img style={{width:'6rem', padding:'0.5rem'}} src="/sk-logo.svg"/>
                    <p><strong style={{fontFamily: "'Open Sans', sans-serif"}}>smartakartan.se</strong></p>
                    <p className="text-muted ng-scope">Crafted with <span className="fa fa-heart animated-hover faa-fast faa-pulse"></span> in GBG, Sverige</p>
                    <p className="text-muted socials">
                    <a href="https://kollaborativekonomi.se">
                        <img style={{width: '2.8rem'}} src="/KES_with_border.png"/>
                    </a>
                    <a href="https://www.facebook.com/smartakartan.se" target="_blank" className="facebook" title="Facebook">
                        <span className="fa-stack fa-lg">
                        <i className="fa fa-circle fa-stack-2x"></i>
                        <i className="fa fa-facebook fa-stack-1x fa-inverse"></i>
                        </span>
                    </a>
                    <a href="https://www.linkedin.com/company/kollaborativ-ekonomi" target="_blank" className="linkedin" title="Linkedin">
                        <span className="fa-stack fa-lg">
                        <i className="fa fa-circle fa-stack-2x"></i>
                        <i className="fa fa-linkedin fa-stack-1x fa-inverse"></i>
                        </span>
                    </a>
                    </p>
                    <p className="text-muted ng-binding">© 2023 All rights reserved</p>
                </div>
                <div className="col-lg-2 col-md-2 col-xs-6 col-sm-3">
                    <ul className="list-unstyled">
                    <li><strong>Smartakartan</strong></li>
                    <li><a href="http://forum.smartakartan.se" target="_blank" className="ng-scope">Forum</a></li>
                    <li><a href="https://kollaborativekonomi.se" target="_blank" className="ng-scope">KES</a></li>
                    <li><a href="https://www.smartakartan.se/om-smarta-kartan" target="_blank" className="ng-scope">About the map</a></li>
                    <li><a href="https://www.smartakartan.se/vardegrund" target="_blank" className="ng-scope">Our values</a></li>
                    <li><a href="https://gitlab.com/kollaborativ-ekonomi-sverige/smartakartan" className="ng-scope">Open source</a></li>
                    </ul>
                </div>
                <div className="col-lg-2 col-md-2 col-xs-6 col-sm-3">
                    <ul className="list-unstyled">
                    <li><strong>Regions</strong></li>
                    {regions.map((region) => 
                    <li><Link to={'/r/'+region.properties.slug}>
                        {region.properties.title}
                    </Link></li>
                    )}
                    </ul>
                </div>
                <div className="col-lg-2 col-md-2 col-xs-6 col-sm-3">
                    <ul className="list-unstyled">
                    <li><strong className="ng-scope">Legal</strong></li>
                    <li><a ui-sref="terms" className="ng-scope" href="#!/terms">Terms of service</a></li>
                    <li><Link to="/sitemap">Sitemap</Link></li>
                    </ul>
                </div>
                <div className="clearfix visible-xs-block"></div>
            </Footer>
        </div>
        </>
    );
}

