import { createContext } from 'react';
import {type DateRangeState} from "@/state/types.ts"


export const DateRangeContext = createContext<DateRangeState>({
  dateRange: { from: new Date(), to: new Date() },
  setDateRange: () => {},
})
