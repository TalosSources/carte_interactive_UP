import React from 'react';
import './App.css';
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import RHome from "./pages/RegionalizedHome";
import Details from "./pages/Details";
import PageNotFound from "./pages/PageNotFound";


export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout/>}>
                    <Route index element={<RHome/>}/>
                    <Route path="/details/:initiativeId" element={<Details/>}/>
                    <Route path="/r/:regionId" element={<RHome/>}/>
                    <Route path="*" element={<PageNotFound/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
