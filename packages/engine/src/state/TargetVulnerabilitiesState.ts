import { ArraySchema, Schema, type } from '@colyseus/schema';
import { Vulnerability } from 'common-data/features/ships/types/Vulnerability';
import { TargetVulnerabilities } from 'common-data/features/space/types/GameObjectInfo';

export class TargetVulnerabilitiesState extends Schema implements TargetVulnerabilities {
    @type(['string']) vulnerabilities = new ArraySchema<Vulnerability>();
}
