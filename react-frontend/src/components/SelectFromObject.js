import React from "react";

const SelectFromObject = ( {obj, defaultValue, onChange}) => {
    // obj : { value, text }
    const options = Object.keys(obj).map( key => obj[key]);
    return (
        <select 
            defaultValue={defaultValue || obj[keys[0]].value}
            onChange={onChange}
        >
            {options.map( (opt, i) => {
            return <option 
                key={i + opt.text}
                value={opt.value}>
                    {opt.text}
            </option>
            })}
        </select>
    )
}

export default SelectFromObject;