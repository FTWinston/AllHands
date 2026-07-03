import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import { globSync } from 'glob';
import * as TJS from 'typescript-json-schema';
import { describe, expect, it, beforeAll } from 'vitest';

const scenariosDir = path.join(__dirname, '../scenarios');
const commonDataDir = path.resolve(__dirname, '../../common-data');

function getScenarioFiles(): string[] {
    if (!fs.existsSync(scenariosDir)) {
        return [];
    }
    return fs.readdirSync(scenariosDir)
        .filter(file => file.endsWith('.json'));
}

// Generate JSON Schema from TypeScript types at test time
function generateSchemaFromTypeScript(): TJS.Definition {
    const compilerOptions: TJS.CompilerOptions = {
        strictNullChecks: true,
        baseUrl: commonDataDir,
        paths: {
            'src/*': ['./src/*'],
        },
    };

    // Include all TypeScript files from common-data to ensure all types are available
    const files = globSync('src/**/*.ts', { cwd: commonDataDir, absolute: true });

    const program = TJS.getProgramFromFiles(files, compilerOptions);

    const schema = TJS.generateSchema(program, 'ScenarioConfig', {
        required: true,
        noExtraProps: false,
        ignoreErrors: true,
    });

    if (!schema) {
        throw new Error('Failed to generate schema from TypeScript');
    }

    return schema;
}

describe('Scenario files', () => {
    const scenarioFiles = getScenarioFiles();
    let ajv: InstanceType<typeof Ajv>;
    let validate: ReturnType<typeof ajv.compile>;

    // Schema generation compiles all of common-data with typescript-json-schema; under
    // full-suite parallel load that can exceed vitest's default 10s hook timeout.
    beforeAll(() => {
        const schema = generateSchemaFromTypeScript();
        ajv = new Ajv({ allErrors: true });
        validate = ajv.compile(schema);
    }, 60_000);

    it('should have at least one scenario file', () => {
        expect(scenarioFiles.length).toBeGreaterThan(0);
    });

    describe.each(scenarioFiles)('%s', (filename) => {
        const filePath = path.join(scenariosDir, filename);
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        it('should be valid JSON', () => {
            expect(() => JSON.parse(fileContent)).not.toThrow();
        });

        it('should conform to ScenarioConfig schema', () => {
            const data = JSON.parse(fileContent);
            const valid = validate(data);

            if (!valid && validate.errors) {
                const errors = validate.errors
                    .map(err => `  ${err.schemaPath || '/'}: ${err.message}`)
                    .join('\n');
                throw new Error(`Schema validation failed:\n${errors}`);
            }

            expect(valid).toBe(true);
        });

        it('should only reference factions declared in factions[]', () => {
            const data = JSON.parse(fileContent);
            const factionIds = new Set((data.factions ?? []).map((faction: { id: string }) => faction.id));

            // A typo'd faction id here doesn't fail loudly - GameObjectInfo.faction and
            // FactionRegistry.getRelationship both silently fall back to treating the object as
            // Neutral, so it just never fights. This test exists to catch that typo instead.
            expect(factionIds.has(data.playerFaction)).toBe(true);

            for (const encounter of data.encounters ?? []) {
                for (const enemy of encounter.enemies ?? []) {
                    if (enemy.faction !== undefined) {
                        expect(factionIds.has(enemy.faction)).toBe(true);
                    }
                }
            }
        });
    });
});
