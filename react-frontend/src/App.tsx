import React, { useEffect, useState } from 'react';
import {BrowserRouter, Routes, Route} from "react-router-dom";

import { Layout } from "./pages/Layout";
import Home from "./pages/Home";
import Details from "./pages/Details";
import TagPage from "./pages/TagPage";
import PageNotFound from "./pages/PageNotFound";
import Sitemap from "./pages/Sitemap";
import { Initiative, Region, fetchInitiatives, fetchRegions } from './KesApi';
import { registerInitiativeTranslations } from './i18n';

import './i18n'


export default function App() {
    const [localizedInitiatives, setLocalizedInitiatives] = useState<Initiative[]>([]);
    const [globalInitiatives, setGlobalInitiatives] = useState<Initiative[]>([]);
    const [regionList, setRegionList] = useState<Region[]>([]);
    useEffect(() => {
        // fetch initial initiatives
        fetchInitiatives()
            .then(initiatives => {
                const [global, local] = initiatives
                    .reduce((result: Initiative[][], initiative: Initiative) => {
                        result[initiative.locations.features.length > 0 ? 1 : 0].push(initiative);
                        return result;
                    },
                    [[], []]);

                setLocalizedInitiatives(local);
                setGlobalInitiatives(global);
                for (const i of initiatives) {
                    registerInitiativeTranslations(i);
                }
            })
            .catch(err => console.error(err));

        // Fetch regions
        fetchRegions()
            .then(regions => {
                console.log("regionList", regions);
                setRegionList(regions);
            }
            )
            .catch(err => console.error(err));
        
    }, []);
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout regions={regionList}/>}>
                    <Route index element={<Home
                                             regionList={regionList}
                                             localizedInitiatives={localizedInitiatives}
                                             globalInitiatives={globalInitiatives}
                                           />}/>
                    <Route path="/details/:initiativeSlug" element={<Details initiatives={[...localizedInitiatives, ...globalInitiatives]}/>}/>
                    <Route path="/sitemap" element={<Sitemap/>}/>
                    <Route path="/tag/:tagId" element={<TagPage/>}/>
                    <Route path="/r/:regionSlug" element={<Home
                                                             regionList={regionList}
                                                             localizedInitiatives={localizedInitiatives}
                                                             globalInitiatives={globalInitiatives}
                                                          />}/>
                    <Route path="*" element={<PageNotFound/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
