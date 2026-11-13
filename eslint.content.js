// Rules for what may import what, around the content folder.
//
// Each content folder's files are split by which part of the game they're for, by their names:
// - *.shared.ts is data that the engine and the clients share (type-checked as part of common-data).
// - *.engine.ts, and *.test.ts, are for the engine (type-checked as part of engine).
// - *.ui.ts(x), and *.test.tsx, are for the clients (type-checked as part of common-ui).
// Each may only import what that part of the game has. On top of that:
// - Content folders reach each other through `content/...`, never `../`, so these rules can see where an import goes.
// - Nothing outside a sector's folder imports from it, and a folder within a sector imports nothing from another one:
//   something two encounters both need belongs in content/general or content/systems.
//   So the manifests (content/content.*.ts) are the only way in to a sector, and leaving one out of them leaves it out of the build.
// - The packages only import the content manifests, and only where content is registered (or where common-data puts the shared content together).
//   Anywhere else, content is reached through the registries (`getCardDefinition` and the like). Types can be imported from anywhere.
import tseslint from '@typescript-eslint/eslint-plugin';

const rule = '@typescript-eslint/no-restricted-imports';

const restrictions = {
    sharedSide: [
        { regex: '^(engine|common-ui|game-ui|player-ui)(/|$)', message: 'Shared content is data that the engine and the clients both use, so it can only import common-data.' },
        { regex: '^react(-dom)?(/|$)', message: 'Shared content is data that the engine and the clients both use, so it can only import common-data.' },
        { regex: '\\.(engine|ui)$', message: 'Shared content can only import other shared content.' },
        {
            regex: '^common-data/features/(cards/utils/cardDefinitions|ships/utils/systemEffectDefinitions)$',
            allowTypeImports: true,
            message: 'These are put together from the shared content, so shared content can only import types from them. Import from the content file that defines the value instead.',
        },
    ],
    engineSide: [
        { regex: '^(common-ui|game-ui|player-ui)(/|$)', message: 'Engine content runs in the engine, which has no UI.' },
        { regex: '^react(-dom)?(/|$)', message: 'Engine content runs in the engine, which has no UI.' },
        { regex: '\\.ui$', message: 'Engine content runs in the engine, which has no UI.' },
    ],
    uiSide: [
        { regex: '^engine(/|$)', allowTypeImports: true, message: 'UI content runs in the clients, which only have the engine\'s types.' },
        { regex: '\\.engine$', allowTypeImports: true, message: 'UI content runs in the clients, which only have engine content\'s types.' },
    ],
    contentFolders: [
        { regex: '^\\.\\./', message: 'Import from another content folder by its `content/...` path, so that what can import what can be checked.' },
    ],
    outsideSectors: [
        { regex: '^content/sectors(/|$)', message: 'Only the content manifests import a sector: what something outside a sector needs belongs in content/general or content/systems.' },
    ],
    insideSectors: [
        { regex: '^content/sectors(/|$)', message: 'Content in one encounter (or sector) can\'t import another\'s: move what they both need to content/general or content/systems.' },
    ],
    packages: [
        {
            regex: '^content(/|$)',
            allowTypeImports: true,
            message: 'Reach content through the registries (e.g. `getCardDefinition`), which it is registered with at startup. Only the entry points import the content manifests.',
        },
    ],
    enginePackage: [
        { regex: '^content/(.*\\.ui|content\\.ui)$', message: 'The engine has no UI.' },
    ],
    uiPackages: [
        { regex: '^content/(.*\\.engine|content\\.engine)$', allowTypeImports: true, message: 'The clients only have the engine\'s types.' },
    ],
    commonDataPackage: [
        { regex: '^content/(?!content\\.shared$)', allowTypeImports: true, message: 'common-data only knows about shared content, through the shared content manifest.' },
    ],
};

/** A config that restricts imports in the files that match every one of the given globs. */
function restrict(name, files, ...lists) {
    return {
        name,
        files: [files],
        plugins: { '@typescript-eslint': tseslint },
        rules: { [rule]: ['error', { patterns: lists.flat() }] },
    };
}

const sides = {
    shared: { files: '**/*.shared.ts', restrictions: restrictions.sharedSide },
    engine: { files: '**/*.{engine,test}.ts', restrictions: restrictions.engineSide },
    ui: { files: '**/*.{ui.ts,ui.tsx,test.tsx}', restrictions: restrictions.uiSide },
};

const places = {
    outsideSectors: { files: 'content/{*,general/**/*,systems/**/*}', restrictions: restrictions.outsideSectors },
    insideSectors: { files: 'content/sectors/**/*', restrictions: restrictions.insideSectors },
};

const packages = {
    'common-data': restrictions.commonDataPackage,
    'engine': restrictions.enginePackage,
    'common-ui': restrictions.uiPackages,
    'game-ui': restrictions.uiPackages,
    'player-ui': restrictions.uiPackages,
};

/** Where content is registered, or put together: these can import the content manifests. */
const entryPoints = [
    'packages/common-data/src/features/cards/utils/cardDefinitions.ts',
    'packages/common-data/src/features/ships/utils/systemEffectDefinitions.ts',
    'packages/engine/src/index.ts',
    'packages/game-ui/src/main.tsx',
    'packages/player-ui/src/main.tsx',
];

const testFiles = '**/*.{test,stories}.{ts,tsx}';

export const contentImportRules = [
    ...Object.entries(sides).flatMap(([side, { files, restrictions: sideRestrictions }]) =>
        Object.entries(places).map(([place, { files: placeFiles, restrictions: placeRestrictions }]) =>
            restrict(`content/${side}/${place}`, [placeFiles, files], sideRestrictions, restrictions.contentFolders, placeRestrictions))),
    ...Object.entries(packages).flatMap(([pkg, packageRestrictions]) => [
        {
            ...restrict(`packages/${pkg}`, [`packages/${pkg}/src/**/*.{ts,tsx}`], packageRestrictions, restrictions.packages),
            ignores: [testFiles, ...entryPoints],
        },
        restrict(`packages/${pkg}/tests-and-entry-points`, [`packages/${pkg}/src/**/*.{ts,tsx}`, `{${testFiles},${entryPoints.join(',')}}`], packageRestrictions),
    ]),
];
