import type { SectorNodeInfo } from './SectorNodeInfo';

/** What science's long range sensors reveal about a node that can be travelled to next. */
export type SectorDestinationInfo = Pick<SectorNodeInfo, 'id' | 'kind' | 'name' | 'elite' | 'environment' | 'factionId' | 'objective'>;
