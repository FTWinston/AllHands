// Registers every piece of content before each test file runs, as the engine and the clients do when they start.
import { registerUiContent } from 'common-ui/content/registerUiContent';
import { registerEngineContent } from 'engine/content/registerEngineContent';
import { engineContent } from 'content/content.engine';
import { uiContent } from 'content/content.ui';

registerEngineContent(engineContent);
registerUiContent(uiContent);
