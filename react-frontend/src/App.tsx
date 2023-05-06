import React from 'react';
import {BrowserRouter, Routes, Route} from "react-router-dom";

import { Layout } from "./pages/Layout";
import Home from "./pages/Home";
import Details from "./pages/Details";
import TagPage from "./pages/TagPage";
import PageNotFound from "./pages/PageNotFound";
import Sitemap from "./pages/Sitemap";


export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout/>}>
                    <Route index element={<Home/>}/>
                    <Route path="/details/:initiativeSlug" element={<Details/>}/>
                    <Route path="/sitemap" element={<Sitemap/>}/>
                    <Route path="/tag/:tagId" element={<TagPage/>}/>
                    <Route path="/r/:regionSlug" element={<Home/>}/>
                    <Route path="*" element={<PageNotFound/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
