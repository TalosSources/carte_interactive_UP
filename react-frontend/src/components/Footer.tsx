import { version } from '../version'
import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { type Region } from '../lib/KesApi'
import { getRegionTitle } from '../lib/i18n'

const Footer = styled.div`
    padding-top: 2rem;
`

export function CIFooter ({ regions }: { regions: Region[] }): React.JSX.Element {
  return <Footer className="row footer ng-scope pt-10" ng-controller="Footer">
            <div className="col-lg-offset-3 col-xs-6 col-sm-3 col-md-offset-1 col-md-3 col-lg-3 company">
                {/* <img style={{ width: '6rem', padding: '0.5rem' }} src="/sk-logo.svg"/> */}
                <img style={{ width: '6rem', padding: '0.5rem' }} src="/UP_logo_standard.png"/>
                {/* <p><strong style={{ fontFamily: "'Open Sans', sans-serif" }}>smartakartan.se</strong></p> */}
                {/* <p className="text-muted ng-scope">Crafted with <span className="fa fa-heart animated-hover faa-fast faa-pulse"></span> in GBG, Sverige</p>
                <p className="text-muted socials">
                <a href="https://kollaborativekonomi.se">
                    <img style={{ width: '2.8rem' }} src="/KES_with_border.png"/>
                </a>
                <a href="https://www.facebook.com/smartakartan.se" target="_blank" className="facebook" title="Facebook" rel="noreferrer">
                    <span className="fa-stack fa-lg">
                        <i className="fa fa-circle fa-stack-2x"></i>
                        <i className="fa fa-facebook fa-stack-1x fa-inverse"></i>
                    </span>
                </a>
                <a href="https://www.linkedin.com/company/kollaborativ-ekonomi" target="_blank" className="linkedin" title="Linkedin" rel="noreferrer">
                    <span className="fa-stack fa-lg">
                    <i className="fa fa-circle fa-stack-2x"></i>
                    <i className="fa fa-linkedin fa-stack-1x fa-inverse"></i>
                    </span>
                </a>
                </p> */}
                <p className="text-muted">Version: {version}</p>
                {/* <p className="text-muted ng-binding">© 2024 All rights reserved</p> */}
            </div>
            {/* <div className="col-lg-2 col-md-2 col-xs-6 col-sm-3">
                <ul className="list-unstyled">
                <li key="links-title"><strong>Smartakartan</strong></li>
                <li key="links-about"><a href="https://www.smartakartan.se/om-smarta-kartan" target="_blank" className="ng-scope" rel="noreferrer">About us</a></li>
                <li key="links-values"><a href="https://www.smartakartan.se/vardegrund" target="_blank" className="ng-scope" rel="noreferrer">What&apos;s on the map?</a></li>
                <li key="links-admin"><a href="/admin" target="_blank" className="ng-scope">Curation panel</a></li>
                <li key="links-forum"><a href="/help/aboutBeta" target="_blank" className="ng-scope">About the beta</a></li>
                <li key="links-gitlab"><a href="https://gitlab.com/kollaborativ-ekonomi-sverige/smartakartan" className="ng-scope">Open source</a></li>
                </ul>
            </div> */}
            <div className="col-lg-2 col-md-2 col-xs-6 col-sm-3">
                <ul className="list-unstyled">
                <li key="regions-title"><strong>Regions</strong></li>
                {regions.map((region) =>
                <li key={'regions-list-' + region.properties.slug}><Link to={'/r/' + region.properties.slug}>
                    {getRegionTitle(region)}
                </Link></li>
                )}
                </ul>
            </div>
            {/* <div className="col-lg-2 col-md-2 col-xs-6 col-sm-3">
                <ul className="list-unstyled">
                <li key="legal-title"><strong className="ng-scope">Legal</strong></li>
                <li key="legal-tos"><a className="ng-scope" href="#!/terms">Terms of service</a></li>
                <li key="legal-sitemap"><Link to="/sitemap">Sitemap</Link></li>
                </ul>
            </div> */}
            <div className="clearfix visible-xs-block"></div>
        </Footer>
}
