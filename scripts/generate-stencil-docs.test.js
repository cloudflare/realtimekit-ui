const assert = require('node:assert/strict');
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
  assert.deepEqual(
    documented,
    [
      { name: 'iconPack', description: 'Icon pack', defaultValue: 'defaultIconPack' },
      { name: 't', description: 'Language', defaultValue: 'useLanguage()' },
    ]
  );
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
