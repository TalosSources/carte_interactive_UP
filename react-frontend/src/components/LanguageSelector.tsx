import React from 'react'
import { type Language } from '../lib/KesApi'

function LanguageSelector (prop: { value: string
  handleSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  languages: Language[]
}): React.JSX.Element {
  // Inspiration: https://reactjs.org/docs/forms.html#the-select-tag
  return (
    <div id="languageSelector">
      <select value={prop.value} onChange={(event) => { prop.handleSelectChange(event) }}>
        {
          prop.languages.map(
            (language) => (
              <option key={language.code} value={language.code}>
                  {language.flag} {language.nativeName}
              </option>
            )
          )
        }
      </select>
    </div>
  )
}

export default LanguageSelector
