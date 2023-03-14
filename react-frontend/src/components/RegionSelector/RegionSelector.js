import React from 'react';

// Components
function RegionSelector({ value, handleSelectChange, regionList }) {
    // Inspiration: https://reactjs.org/docs/forms.html#the-select-tag
    console.log(value);
    return (
        <select value={value} onChange={handleSelectChange}>
            {
                regionList.map(
                    (regionElement) => (
                        //<option key={regionElement.id} value={regionElement.id}>
                        <option key={regionElement.id} value={regionElement.slug}>
                            {regionElement.title}
                        </option>
                    )
                )
            }
        </select>
    );
}

export default RegionSelector;