import React from "react";

// probably better to work with "active region"
// Rather than "activeRegionSlug"
const RegionSelectorDropdown = ({ regionList, activeRegionSlug, setActiveRegionSlug}) => {
     return (<div className="dropdown show ml-4">
     <a className="btn text-white dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
         {(() => {
             const region = regionList.find(reg => reg.properties.slug == activeRegionSlug)
             return region?.properties.title || "Välj ort";
         })() }
     </a>

    <div className="dropdown-menu" aria-labelledby="dropdownMenuLink">
        {
            regionList.map(
                (regionElement) => (
                     <a className="dropdown-item" 
                     key={regionElement.id}
                     onClick={() => {
                         setActiveRegionSlug(regionElement.properties.slug);
                        }
                    }>{regionElement.properties.title}</a>
                )
             )
         }
     </div>
     </div>)
}

export default RegionSelectorDropdown;