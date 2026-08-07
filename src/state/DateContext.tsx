import { createContext } from 'react';
import {type DateState} from "@/state/types.ts"


export const DateContext = createContext<DateState>({
  date: new Date(),
  setDate: () => {},
})
