import React from 'react'
import { Outlet } from 'react-router-dom'
import { type Region } from '../lib/KesApi'
import NavBar from '../components/NavBar'
import { CIFooter } from '../components/Footer'

export function Layout ({ regions }: { regions: Region[] }): React.JSX.Element {
  return (
        <>
        <div className="container">
            <nav>
                <NavBar/>
            </nav>

            <Outlet />

            <CIFooter regions={regions}/>
        </div>
        </>
  )
}
