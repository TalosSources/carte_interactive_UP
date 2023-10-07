import type React from 'react'
import { useTranslation } from 'react-i18next'

interface Alternative { value: string, text: string }
export type AlternativeMap = Record<string, Alternative>
interface Props { obj: AlternativeMap, defaultValue: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }

function SelectFromObject ({ obj, defaultValue, onChange }: Props): React.JSX.Element {
  // const SelectFromObject = ({obj, defaultValue, onChange}) => {
  // obj :{ alnternative { value, text }}
  const options = Object.keys(obj).map(key => obj[key])
  const { t } = useTranslation()
  return (
        <select
            defaultValue={defaultValue.length > 0 || Object.values(obj)[0]?.value}
            onChange={onChange}
        >
            {options.map((opt, i) => {
              return <option
                key={i.toString() + opt.text}
                value={opt.value}>
                    {t(opt.text)}
            </option>
            })}
        </select>
  )
}

export default SelectFromObject
