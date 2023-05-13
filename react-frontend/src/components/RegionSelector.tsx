import React from 'react';
import { Region } from '../KesApi';

type PropTypes = {
    value: string;
    handleSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    regionList: Region[];
}
// Components
function RegionSelector({ value, handleSelectChange, regionList }: PropTypes) {
    // Inspiration: https://reactjs.org/docs/forms.html#the-select-tag
    return (
        <select value={value} onChange={(event) => handleSelectChange(event)}>
            {
                regionList.map(
                    (regionElement) => (
                        <option key={regionElement.properties.slug} value={regionElement.properties.slug}>
                            {regionElement.properties.title}
                        </option>
                    )
                )
            }
        </select>
    );
}

export default RegionSelector;