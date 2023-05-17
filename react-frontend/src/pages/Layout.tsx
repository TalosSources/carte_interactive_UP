import React from 'react';
import { Outlet, Link } from "react-router-dom";

export function Layout() {
    return (
        <div>
            <nav>
            </nav>

            <Outlet />

            <div id="footer" class="row">
                <div id="footer-sk-kes" className='col-md-3'>
                    Smartakartan
                    by
                    KES

                    Made with Love at GBG
                    
                    Source Code
                </div>
                <div id="footer-regions-kes" className='col-md-3'>
                    <h5>Participating regions </h5>
                    <ul>
                        {regions.map((region) => 
                        <li><Link to={'/r/'+region.properties.slug}>
                            {region.properties.title}
                        </Link></li>
                        )}
                    </ul>
                </div>
                <div id="footer-region-pages" className="col-md-3">

                </div>
                <div id="footer-other-pages" className="col-md-3">
                    <Link to="/sitemap">Sitemap</Link>
                </div>
            </div>
        </div>
    );
}

