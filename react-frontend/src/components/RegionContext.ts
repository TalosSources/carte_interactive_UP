import { createContext } from 'react'
import { type Region } from '../lib/KesApi'

export const RegionContext = createContext<Region | undefined>(undefined)
