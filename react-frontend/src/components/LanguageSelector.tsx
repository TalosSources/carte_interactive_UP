import React from 'react';
import { Language } from '../KesApi';

function LanguageSelector(prop : {value : string,
    handleSelectChange :(e: React.ChangeEvent<HTMLSelectElement>) => void,
    languages : Language[],
    }) {
    // Inspiration: https://reactjs.org/docs/forms.html#the-select-tag
    console.log(prop);
    return <div id="languageSelector">
        <select value={prop.value} onChange={(event) => prop.handleSelectChange(event)}>
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
}

export default LanguageSelector