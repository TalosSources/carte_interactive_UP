import React from "react";
import { Region } from "../KesApi";

// probably better to work with "active region"
// Rather than "activeRegionSlug"

type PropTypes = {
    regionList: Region[];
    activeRegionSlug: string;
    setActiveRegionSlug: (aSlug: string) => void;
}

const RegionSelectorDropdown = ({ regionList, activeRegionSlug, setActiveRegionSlug}: PropTypes) => {
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
                     key={regionElement.properties.slug}
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