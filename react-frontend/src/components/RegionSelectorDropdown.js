import React from "react";

// probably better to work with "active region"
// Rather than "activeRegionSlug"
const RegionSelectorDropdown = ({ regionList, activeRegionSlug, setActiveRegionSlug}) => {
     return (<div class="dropdown show ml-4">
     <a class="btn text-white dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
         {(() => {
             const region = regionList.find(reg => reg.slug == activeRegionSlug)
             return region?.title || "Välj ort";
         })() }
     </a>

     <div class="dropdown-menu" aria-labelledby="dropdownMenuLink">
         {
             regionList.map(
                 (regionElement) => (
                     <a className="dropdown-item" 
                         href="#"
                         key={regionElement.id}
                      onClick={() => {
                         console.log(regionElement.slug);
                         setActiveRegionSlug(regionElement.slug);
                     }
                     }>{regionElement.title}</a>
                 )
             )
         }
     </div>
     </div>)
}

console.log("RSD", RegionSelectorDropdown)
export default RegionSelectorDropdown;