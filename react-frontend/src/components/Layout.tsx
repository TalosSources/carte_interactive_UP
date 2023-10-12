import React from 'react'
import { Outlet } from 'react-router-dom'
import { type Region } from '../lib/KesApi'
import NavBar from '../components/NavBar'
import { SKFooter } from '../components/Footer'

export function Layout ({ regions, regionSlug }: { regions: Region[], regionSlug: string }): React.JSX.Element {
  let activeRegion = regions.filter(r => r.properties.slug === regionSlug)[0]
  if (regions.length === 0) {
    activeRegion = {
      properties: {
        slug: '',
        title: '',
        welcome_message_html: '',
        rp_region: []
      }
    }
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
  )
}
