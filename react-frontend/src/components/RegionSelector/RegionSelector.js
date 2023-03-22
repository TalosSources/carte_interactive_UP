import React from 'react';

// Components
function RegionSelector({ value, handleSelectChange, regionList }) {
    // Inspiration: https://reactjs.org/docs/forms.html#the-select-tag
    return (
        <select value={value} onChange={(event) => handleSelectChange(event)}>
            {
                regionList.map(
                    (regionElement) => (
                        <option key={regionElement.id} value={regionElement.properties.slug}>
                            {regionElement.properties.title}
                        </option>
                    )
                )
            }
        </select>
    );
}

export default RegionSelector;