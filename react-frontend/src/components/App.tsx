import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { Layout } from './Layout'
import Home from '../pages/home/Home'
import Details from '../pages/details/Details'
import TagPage from '../pages/TagPage'
import PageNotFound from '../pages/PageNotFound'
import Sitemap from '../pages/Sitemap'
import { type Region, fetchRegions } from '../lib/KesApi'
import { registerRegionPageTitles } from '../lib/i18n'

import RegionPage from '../pages/RegionPage'
import { QueryBoundaries } from '../lib/QueryBoundary'
import { ModerationPanelHelp } from './ModerationPanelHelp'
import { AboutBeta, Banner } from './Banner'
import { injectMatomo } from './MatomoInjection'

export default function App (): React.JSX.Element {
  const [regionList, setRegionList] = useState<Region[]>([])
  const [regionSlug, setRegionSlug] = useState<string>('global')
  useEffect(() => {
    // Fetch regions
    fetchRegions()
      .then(regions => {
        console.log('regionList', regions)
        setRegionList(regions)
        for (const r of regions) {
          registerRegionPageTitles(r)
        }
      }
      )
      .catch(err => { console.error(err) })
  }, [])
  React.useEffect(() => {
    injectMatomo()
  }, [])
  return (
        <BrowserRouter>
            <Banner/>
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
                    <Route path="/help/moderationPanel" element={<ModerationPanelHelp/>}/>
                    <Route path="/help/aboutBeta" element={<AboutBeta/>}/>
                    <Route path="*" element={<PageNotFound/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
  )
}
