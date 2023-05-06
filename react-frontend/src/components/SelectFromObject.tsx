import React from "react";
import { useTranslation } from "react-i18next";

type Alternative = { value: string, text: string};
export type AlternativeMap = {[key: string] : Alternative};
type Props = {obj: AlternativeMap, defaultValue: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void} 

const SelectFromObject = ({obj, defaultValue, onChange}: Props) => {
    // const SelectFromObject = ({obj, defaultValue, onChange}) => {
    // obj :{ alnternative { value, text }}
    const options = Object.keys(obj).map( key => obj[key]);
    const {t} = useTranslation();
    return (
        <select 
            defaultValue={defaultValue || Object.values(obj)[0]?.value}
            onChange={onChange}
        >
            {options.map( (opt, i) => {
            return <option 
                key={i + opt.text}
                value={opt.value}>
                    {t(opt.text)}
            </option>
            })}
        </select>
    )
}

export default SelectFromObject;