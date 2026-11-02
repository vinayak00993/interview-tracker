import { cache } from "react";
import { getOpportunity } from "./opportunities";

/** Request-scoped memo so a layout and its tab page share one query. */
export const getOpportunityCached = cache(getOpportunity);
