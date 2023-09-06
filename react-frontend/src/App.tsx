import React, { useEffect, useState } from 'react';
import {BrowserRouter, Routes, Route} from "react-router-dom";

import { Layout } from "./pages/Layout";
import Home from "./pages/Home";
import Details from "./pages/Details";
import TagPage from "./pages/TagPage";
import PageNotFound from "./pages/PageNotFound";
import Sitemap from "./pages/Sitemap";
import { Region, fetchRegions } from './KesApi';
import { registerRegionPageTitles } from './i18n';

import './i18n'
import RegionPage from './pages/RegionPage';
import { QueryBoundaries } from './QueryBoundary';
import CookieConsent from 'react-cookie-consent';


export default function App() {
    const [regionList, setRegionList] = useState<Region[]>([]);
    const [regionSlug, setRegionSlug] = useState<string>('global');
    useEffect(() => {
        // Fetch regions
        fetchRegions()
            .then(regions => {
                console.log("regionList", regions);
                setRegionList(regions);
                for (const r of regions) {
                    registerRegionPageTitles(r);
                }
            }
            )
            .catch(err => console.error(err));
        
    }, []);
    return (
        <BrowserRouter>
            <CookieConsent
                expires={2}
                overlay
                debug
            >
                <h2>Welcome to SK4 beta.</h2>
                <div>
                    This is a preview for the next version of smartakartan. Feel free to play around and test this new version.
                    Please note that changes made here will be overwritten at some point.
                </div>
                Notable changes:
                <ul>
                    <li>Reworked admin UI</li>
                    <li>Real-time search</li>
                </ul>

                To the <a href="/admin">admin UI.</a><br/>
                Credentials
                <ul>
                    <li>
                        test site maintainer
                        <ul>
                            <li>
                                username: admin
                            </li>
                            <li>
                                password: admin
                            </li>
                        </ul>
                    </li>
                    <li>
                        test curator / moderator
                        <ul>
                            <li>
                                username: curator
                            </li>
                            <li>
                                password: curator
                            </li>
                        </ul>
                    </li>
                </ul>

                <div>
                We're happy about any feedback. Please reach out to us.
                </div>

                <div>
                    We're tracking all kind of behavior and browser information.
                </div>
            </CookieConsent>
            <Routes>
                <Route path="/" element={<Layout regions={regionList} regionSlug={regionSlug}/>}>
                    <Route index element={<Home
                                             regionList={regionList}
                                             setRegionSlug={setRegionSlug}
                                             regionSlug={regionSlug}
                                           />}/>
                    <Route path="/details/:initiativeSlug" element={<QueryBoundaries><Details/></QueryBoundaries>}/>
                    <Route path="/sitemap" element={<Sitemap/>}/>
                    <Route path="/tag/:tagId" element={<TagPage/>}/>
                    <Route path="/r/:regionSlugP" element={<Home
                                                             regionList={regionList}
                                                            setRegionSlug={setRegionSlug}
                                                            regionSlug={regionSlug}
                                                          />}/>
                    <Route path="/r/:regionSlugP/:page" element={<RegionPage/>}/>
                    <Route path="*" element={<PageNotFound/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
