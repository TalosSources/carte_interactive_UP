import React, { useState, useEffect, startTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchRow } from './Home'

export function SearchBox ({ setQuery, initialSearch }: { setQuery: (query: string) => void, initialSearch: string }): React.JSX.Element {
  const { t } = useTranslation()

  const [searchString, setSearchString] = useState(initialSearch)

  useEffect(() => {
    startTransition(() => {
      setQuery(searchString)
    })
  }, [searchString])

  let searchPlaceholder = t('ui.searchPlaceholder')
  if (typeof searchPlaceholder === 'undefined') {
    searchPlaceholder = 'Search something'
  }

  return <div>
    <SearchRow className="d-flex flex-row w-100">
      <input
        className="form-control"
        name="search"
        placeholder={searchPlaceholder}
        value={searchString}
        onChange={event => { setSearchString(event.target.value) }} />
    </SearchRow>
  </div>
}
