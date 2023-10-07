import type React from 'react'
import { useParams } from 'react-router-dom'
import { useRegionPage } from '../KesApi'
import PageNotFound from './PageNotFound'
import { QueryBoundaries } from '../QueryBoundary'
import { useTranslation } from 'react-i18next'

export default function RegionPage (): React.JSX.Element {
  return <QueryBoundaries>
        <RegionPageBody/>
    </QueryBoundaries>
}

function RegionPageBody (): React.JSX.Element {
  const { t } = useTranslation()
  const { regionSlugP, page } = useParams()

  if (typeof regionSlugP === 'undefined') {
    return <PageNotFound/>
  }
  if (typeof page === 'undefined') {
    return <PageNotFound/>
  }

  useRegionPage(regionSlugP, page)

  const description = t('region.' + regionSlugP + '.' + page + '.description')

  return <>
        <h1>{t('region.' + regionSlugP + '.' + page + '.title')}</h1>
        <div className="card-title" dangerouslySetInnerHTML={{ __html: description }}></div>
        </>
}
