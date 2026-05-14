import { ArraySchema, Schema, type } from '@colyseus/schema';
import { TargetVulnerabilities } from 'common-data/features/space/types/GameObjectInfo';
import { VulnerabilityState } from './VulnerabilityState';

export class TargetVulnerabilitiesState extends Schema implements TargetVulnerabilities {
    @type([VulnerabilityState]) vulnerabilities = new ArraySchema<VulnerabilityState>();
}
