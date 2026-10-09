const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { before, test } = require('node:test');
const { StencilDocGenerator } = require('./generate-stencil-docs');

const generator = new StencilDocGenerator(
  path.join(__dirname, '../packages/core/src/components.d.ts'),
  path.join(__dirname, '../docs/angular'),
  'angular'
);

before(async () => {
  await generator.parseFile();
});

test('keeps properties whose JSDoc contains @default', () => {
  const props = generator.components.get('RtkAudioTile').props;
  const documented = props
    .filter(({ name }) => ['iconPack', 't'].includes(name))
    .map(({ name, description, defaultValue }) => ({ name, description, defaultValue }));
  assert.deepEqual(documented, [
    { name: 'iconPack', description: 'Icon pack', defaultValue: 'defaultIconPack' },
    { name: 't', description: 'Language', defaultValue: 'useLanguage()' },
  ]);
});

test('keeps @deprecated as a property description without including @default', () => {
  const props = generator.components.get('RtkGrid').props;
  const overrides = props.find((prop) => prop.name === 'overrides');
  assert.equal(overrides.description, '@deprecated');
});

test('does not treat arrow-function types as default assignments', () => {
  const props = generator.components.get('RtkMessageListView').props;
  assert.equal(
    props.find((prop) => prop.name === 'loadMore').type,
    '(lastMessage: Message) => Promise<Message[]>'
  );
  assert.equal(
    props.find((prop) => prop.name === 'renderer').type,
    '(message: Message, index: number) => HTMLElement'
  );
  assert.deepEqual(generator.parseTypeAndDefault('Size = "md"'), {
    type: 'Size',
    defaultValue: '"md"',
  });
});

test('uses edited source wording without matching unrelated comments', () => {
  const description = generator.components.get('RtkAi').description;
  assert.match(description, /^The AI panel shows meeting transcriptions\./);
  assert.equal(generator.components.get('RtkPaginatedList').description, null);
  assert.equal(
    generator.parseComponentDescription('/**\n * Sample description.\n */', 'MissingWidget'),
    'Sample description.'
  );
});

test('preserves existing prose and code-block indentation', () => {
  const description = generator.components.get('RtkSettingsVideo').description;
  assert.match(description, /\n ```ts\n \{/);
  assert.match(description, /\n  prefs: \{\n    mirrorVideo: boolean\n  \}/);
  assert.match(description, /\n \}\n ```/);
  assert.doesNotMatch(description, /\n\nEmits/);
  assert.match(
    generator.components.get('RtkAudioVisualizer').description,
    /\n Commonly used inside `rtk-name-tag`\./
  );
});

test('keeps accepted spacing while applying source wording changes', () => {
  const spotlight = generator.components.get('RtkSpotlightGrid').description;
  assert.match(
    spotlight,
    /\n You can customize the layout to a `column` view, by default is `row`\./
  );
  assert.doesNotMatch(spotlight, /\n\n/);
  assert.equal(
    generator.components.get('RtkChatComposerUi').description,
    '@deprecated . This component is deprecated, please use rtk-chat-composer-view instead.'
  );
});

test('selects renderable core properties and prioritizes meeting in script examples', () => {
  const core = new StencilDocGenerator('unused', 'unused', 'core');
  const example = core.generateCoreExample({
    name: 'rtk-meeting',
    tagName: 'rtk-meeting',
    props: [
      { name: 'applyDesignSystem', type: 'boolean', required: true },
      { name: 'config', type: 'UIConfig', required: true },
      { name: 'meeting', type: 'Meeting', required: true },
      { name: 'size', type: 'Size', required: true },
    ],
  });
  assert.match(example, /<rtk-meeting\n size="md">/);
  assert.match(example, /el\.meeting= meeting;/);

  const scriptOnly = core.generateCoreExample({
    name: 'rtk-permissions-message',
    tagName: 'rtk-permissions-message',
    props: [{ name: 'meeting', type: 'Meeting', required: true }],
  });
  const section = scriptOnly.split('### With Properties')[1];
  assert.ok(section.includes('<rtk-permissions-message>\n</rtk-permissions-message>'));
  assert.ok(section.indexOf('<script>') > section.indexOf('</rtk-permissions-message>'));
  assert.ok(section.includes('el.meeting= meeting;'));

  const unrenderable = core.generateCoreExample({
    name: 'rtk-example',
    tagName: 'rtk-example',
    props: [{ name: 't', type: 'RtkI18n', required: true }],
  });
  assert.doesNotMatch(unrenderable, /### With Properties|<script>/i);
});

test('renders bare deprecation tags as readable property descriptions', async (t) => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rtk-docs-'));
  t.after(() => fs.rmSync(outputDir, { recursive: true }));
  const core = new StencilDocGenerator('unused', outputDir, 'core');
  await core.generateComponentDoc({
    name: 'rtk-grid',
    tagName: 'rtk-grid',
    props: [
      {
        name: 'overrides',
        type: 'any',
        required: false,
        defaultValue: null,
        description: '@deprecated',
      },
    ],
  });

  const content = fs.readFileSync(path.join(outputDir, 'rtk-grid.mdx'), 'utf8');
  assert.match(content, /\| `overrides` \| `any` \| ❌ \| - \| \*\*Deprecated\*\* \|/);
});
