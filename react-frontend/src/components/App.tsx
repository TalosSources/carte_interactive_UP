import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { Layout } from './Layout'
import Home from '../pages/home/Home'
import Details from '../pages/details/Details'
import TagPage from '../pages/TagPage'
import PageNotFound from '../pages/PageNotFound'
import Sitemap from '../pages/Sitemap'
import { type Region, fetchRegions } from '../lib/KesApi'
import { registerRegionPageTitles, registerRegionTranslations } from '../lib/i18n'
import { RegionContext } from './RegionContext'

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
        setRegionList(regions)
        for (const r of regions) {
          registerRegionPageTitles(r)
          registerRegionTranslations(r)
        }
      })
      .catch(err => { console.error(err) })
  }, [])

  React.useEffect(() => {
    injectMatomo()
  }, [])
  const region = regionList.find(r => r.properties.slug === regionSlug)

  return (
    <BrowserRouter>
      <Banner />
      <RegionContext.Provider value={region}>
        <Routes>
          <Route path="/" element={<Layout regions={regionList} />}>
            <Route index element={<Navigate to="/r/sverige" />} />
            <Route path="/details/:initiativeSlug" element={<QueryBoundaries><Details /></QueryBoundaries>} />
            <Route path="/sitemap" element={<Sitemap />} />
            <Route path="/tag/:tagId" element={<TagPage />} />
            <Route path="/r/:regionSlugP" element={<Home setRegionSlug={setRegionSlug} regionList={regionList} />} />
            <Route path="/r/:regionSlugP/:page" element={<RegionPage />} />
            <Route path="/help/moderationPanel" element={<ModerationPanelHelp />} />
            <Route path="/help/aboutBeta" element={<AboutBeta />} />
            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Routes>
      </RegionContext.Provider>
    </BrowserRouter>
  )
}
