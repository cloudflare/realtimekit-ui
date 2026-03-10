#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Enhanced Stencil API Documentation Generator
 * Parses components.d.ts and generates comprehensive MDX documentation
 */
class StencilDocGenerator {
  constructor(filePath, outputDir, frameworkOverride = null) {
    this.filePath = filePath;
    this.outputDir = outputDir;
    this.components = new Map();
    this.events = new Map();
    this.libraryName = frameworkOverride
      ? this.formatFrameworkName(frameworkOverride)
      : this.detectLibraryName(filePath);
  }

  escapeMarkdownTableCell(value) {
    if (value == null) return '';
    return String(value).replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');
  }

  wrapInlineCode(value) {
    const str = this.escapeMarkdownTableCell(value);
    return `\`${str}\``;
  }

  readUntilTopLevelSemicolon(content, startIndex) {
    let buf = '';
    let depthCurly = 0;
    let depthParen = 0;
    let depthBracket = 0;
    let depthAngle = 0;
    let inSingle = false;
    let inDouble = false;
    let inTemplate = false;
    let escaping = false;

    for (let i = startIndex; i < content.length; i++) {
      const ch = content[i];

      if (escaping) {
        buf += ch;
        escaping = false;
        continue;
      }

      if ((inSingle || inDouble || inTemplate) && ch === '\\') {
        buf += ch;
        escaping = true;
        continue;
      }

      if (!inDouble && !inTemplate && ch === "'") {
        inSingle = !inSingle;
        buf += ch;
        continue;
      }

      if (!inSingle && !inTemplate && ch === '"') {
        inDouble = !inDouble;
        buf += ch;
        continue;
      }

      if (!inSingle && !inDouble && ch === '`') {
        inTemplate = !inTemplate;
        buf += ch;
        continue;
      }

      if (inSingle || inDouble || inTemplate) {
        buf += ch;
        continue;
      }

      if (ch === '{') depthCurly++;
      else if (ch === '}') depthCurly = Math.max(0, depthCurly - 1);
      else if (ch === '(') depthParen++;
      else if (ch === ')') depthParen = Math.max(0, depthParen - 1);
      else if (ch === '[') depthBracket++;
      else if (ch === ']') depthBracket = Math.max(0, depthBracket - 1);
      else if (ch === '<') depthAngle++;
      else if (ch === '>') depthAngle = Math.max(0, depthAngle - 1);

      const atTopLevel =
        depthCurly === 0 && depthParen === 0 && depthBracket === 0 && depthAngle === 0;
      if (ch === ';' && atTopLevel) {
        return { value: buf, endIndex: i };
      }

      buf += ch;
    }

    return { value: buf, endIndex: content.length };
  }

  detectLibraryName(filePath) {
    if (filePath.includes('/core/')) return 'Web Components (HTML)';
    if (filePath.includes('/react/')) return 'React';
    if (filePath.includes('/angular/')) return 'Angular';
    return 'Unknown';
  }

  formatFrameworkName(framework) {
    switch (framework.toLowerCase()) {
      case 'core':
        return 'Web Components (HTML)';
      case 'react':
        return 'React';
      case 'angular':
        return 'Angular';
      default:
        return framework;
    }
  }

  async parseFile() {
    const content = fs.readFileSync(this.filePath, 'utf8');

    // Parse Components namespace
    this.parseComponents(content);

    // Parse Events namespace if it exists
    this.parseEvents(content);
  }

  parseComponents(content) {
    // Find the Components namespace
    const componentsMatch = content.match(/export namespace Components \{([\s\S]*?)\n\}/);
    if (!componentsMatch) {
      console.error('Components namespace not found');
      return;
    }

    const componentsContent = componentsMatch[1];

    // Parse each interface in the Components namespace with optional JSDoc comments
    const interfaceRegex = /(\/\*\*[\s\S]*?\*\/\s*)?\s*interface (\w+) \{([\s\S]*?)\n    \}/g;
    let match;

    while ((match = interfaceRegex.exec(componentsContent)) !== null) {
      const [, jsDocComment, componentName, propsContent] = match;
      const props = this.parseProps(propsContent, componentName);
      const description = this.parseComponentDescription(jsDocComment);

      // Set name and tagName based on framework
      const isReact = this.libraryName === 'React';

      this.components.set(componentName, {
        name: isReact ? componentName : this.camelToKebab(componentName), // PascalCase for React, kebab-case for others
        tagName: isReact ? componentName : this.camelToKebab(componentName), // PascalCase for React, kebab-case for others
        props: props,
        description: description,
      });
    }
  }

  parseEvents(content) {
    // Find Events namespace if it exists
    const eventsMatch = content.match(/export namespace Events \{([\s\S]*?)\n\}/);
    if (!eventsMatch) return;

    const eventsContent = eventsMatch[1];
    const interfaceRegex = /interface (\w+) \{([\s\S]*?)\n    \}/g;
    let match;

    while ((match = interfaceRegex.exec(eventsContent)) !== null) {
      const [, componentName, eventsContent] = match;
      const events = this.parseProps(eventsContent, componentName);

      if (this.components.has(componentName)) {
        this.components.get(componentName).events = events;
      }
    }
  }

  parseProps(propsContent, componentName) {
    const props = [];
    const propRegex = /\/\*\*\s*\n\s*\*\s*(.*?)\s*\n\s*\*\/\s*\n\s*"([^"]+)":\s*/g;

    let match;
    while ((match = propRegex.exec(propsContent)) !== null) {
      const [, description, name] = match;
      const typeStartIndex = propRegex.lastIndex;
      const { value: typeWithDefault, endIndex } = this.readUntilTopLevelSemicolon(
        propsContent,
        typeStartIndex
      );

      // Move regex cursor past this property so we can find the next one
      propRegex.lastIndex = Math.min(propsContent.length, endIndex + 1);

      // Parse type and default value from type definition
      const { type } = this.parseTypeAndDefault(typeWithDefault.trim());

      // Try to find default value from source file
      const sourceDefault = this.getDefaultFromSourceFile(componentName, name);

      const finalDefaultValue = sourceDefault;

      props.push({
        name: name,
        type: type,
        description: description.trim(),
        required: !type.includes('undefined') && !type.includes('?') && !finalDefaultValue,
        defaultValue: finalDefaultValue,
      });
    }

    return props;
  }

  extractDefaultFromDescription(description) {
    // Look for patterns like "(default = false)" or "(default = true)" in description
    const defaultMatch = description.match(/\(default\s*=\s*([^)]+)\)/i);
    return defaultMatch ? defaultMatch[1].trim() : null;
  }

  getDefaultFromSourceFile(componentName, propName) {
    try {
      // Convert component name to kebab-case for file path
      const kebabName = this.camelToKebab(componentName);
      const sourceFilePath = path.join(
        path.dirname(this.filePath),
        'components',
        kebabName,
        `${kebabName}.tsx`
      );

      // Check if source file exists
      if (!fs.existsSync(sourceFilePath)) {
        return null;
      }

      // Read the source file
      const sourceContent = fs.readFileSync(sourceFilePath, 'utf8');

      // Simple line-by-line approach to find prop declarations
      const lines = sourceContent.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Look for @Prop decorator
        if (line.includes('@Prop(')) {
          // Check the next line(s) for the prop declaration
          for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
            const propLine = lines[j].trim();

            // Check if this line contains our prop name with a default value
            const propRegex = new RegExp(`^${propName}\\s*:\\s*[^=]+\\s*=\\s*([^;]+);?`);
            const match = propLine.match(propRegex);

            if (match) {
              const defaultValue = match[1].trim();
              return defaultValue;
            }

            // If we find a prop declaration without default, stop looking
            const propWithoutDefaultRegex = new RegExp(`^${propName}\\s*:\\s*[^=]+;?$`);
            if (propWithoutDefaultRegex.test(propLine)) {
              return null;
            }
          }
        }
      }

      return null;
    } catch (error) {
      // Silently fail if we can't read the source file
      return null;
    }
  }

  parseTypeAndDefault(typeString) {
    // Check if there's a default value (pattern: Type = defaultValue)
    const defaultMatch = typeString.match(/^(.+?)\s*=\s*(.+)$/);

    if (defaultMatch) {
      return {
        type: defaultMatch[1].trim(),
        defaultValue: defaultMatch[2].trim(),
      };
    }

    return {
      type: typeString,
      defaultValue: null,
    };
  }

  parseComponentDescription(jsDocComment) {
    if (!jsDocComment) return null;

    // Extract the description from JSDoc comment
    // Remove /** and */ and extract the main description
    const cleanComment = jsDocComment
      .replace(/\/\*\*/, '')
      .replace(/\*\//, '')
      .replace(/^\s*\*/gm, '') // Remove leading * from each line
      .trim();

    // Return the first paragraph (before any @tags)
    const description = cleanComment.split(/\n\s*@/)[0].trim();

    return description || null;
  }

  // for web-components and angular components (converts CamelCase to kebab-case)
  camelToKebab(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  async generateDocs() {
    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Generate index
    await this.generateIndex();

    // Generate component docs
    for (const component of this.components.values()) {
      await this.generateComponentDoc(component);
    }

    console.log(`✅ Generated documentation for ${this.components.size} components`);
  }

  async generateIndex() {
    const content = `---
pcx_content_type: reference
title: ${this.libraryName}
description: Complete API reference for ${this.libraryName} library components
sidebar:
  group:
    hideIndex: true
---`;

    fs.writeFileSync(path.join(this.outputDir, 'index.mdx'), content);
  }

  async generateComponentDoc(component) {
    const { name, tagName, props = [], events = [], description } = component;

    let content = `---
pcx_content_type: navigation
title: ${name}
description: API reference for ${name} component (${this.libraryName} Library)
---
`;

    // Add component description if available
    if (description) {
      content += `${description}

`;
    }

    content += `## Properties

`;
    if (props.length === 0) {
      content += '*No properties available.*\n\n';
    } else {
      content += '| Property | Type | Required | Default | Description |\n';
      content += '|----------|------|----------|---------|-------------|\n';

      props.forEach((prop) => {
        const required = prop.required ? '✅' : '❌';
        const description = prop.description || '*No description*';
        const type = this.formatType(prop.type);
        const defaultValue = prop.defaultValue ? this.wrapInlineCode(prop.defaultValue) : '-';

        content += `| \`${prop.name}\` | ${type} | ${required} | ${defaultValue} | ${description} |\n`;
      });
      content += '\n';
    }

    if (events.length > 0) {
      content += '## Events\n\n';
      content += '| Event | Type | Description |\n';
      content += '|-------|------|-------------|\n';

      events.forEach((event) => {
        const description = event.description || '*No description*';
        const type = this.formatType(event.type);

        content += `| \`${event.name}\` | ${type} | ${description} |\n`;
      });
      content += '\n';
    }

    // Usage examples
    content += this.generateUsageExamples(component);

    fs.writeFileSync(path.join(this.outputDir, `${tagName}.mdx`), content);
  }

  formatType(type) {
    // Clean up TypeScript types for better display
    const safeType = type == null ? '' : String(type);
    return this.wrapInlineCode(safeType);
  }

  generateUsageExamples(component) {
    const { name, tagName, props = [] } = component;

    let content = `## Usage Examples

`;

    // Generate framework-specific examples
    if (this.libraryName === 'React') {
      content += this.generateReactExample(component);
    } else if (this.libraryName === 'Angular') {
      content += this.generateAngularExample(component);
    } else {
      // Core/HTML examples
      content += this.generateCoreExample(component);
    }

    return content;
  }

  generateCoreExample(component) {
    const { name, tagName, props = [] } = component;

    let content = `### Basic Usage

\`\`\`html
<${tagName}></${tagName}>
\`\`\`

`;

    if (props.length > 0) {
      content += `### With Properties

\`\`\`html
<${tagName}`;

      // Add example props (first 3 required props, excluding state-related props)
      const filteredProps = props.filter((p) => !p.name.toLowerCase().includes('state'));
      const exampleProps = filteredProps.filter((p) => p.required).slice(0, 3);
      if (exampleProps.length === 0) {
        // If no required props, show first 3 optional ones
        exampleProps.push(...filteredProps.slice(0, 3));
      }

      exampleProps.forEach((prop) => {
        const exampleValue = this.getCoreValue(prop.name, prop.type);
        content += `${exampleValue}`;
      });

      content += `>
</${tagName}>
\`\`\`

`;
    }

    if (props.length > 0) {
      content += `
\`\`\`html
<script>
  const el = document.querySelector("${name}");
`;
      const filteredProps = props.filter((p) => !p.name.toLowerCase().includes('state'));
      const exampleProps = filteredProps.filter((p) => p.required).slice(0, 3);
      if (exampleProps.length === 0) {
        // If no required props, show first 3 optional ones
        exampleProps.push(...filteredProps.slice(0, 3));
      }
      exampleProps.forEach((prop) => {
        const exampleValue = this.getCoreScript(prop.name, prop.type);
        content += `${exampleValue}`;
      });

      content += `
</script>
\`\`\`
`;
    }

    return content;
  }

  generateReactExample(component) {
    const { name, props = [] } = component;

    let content = `### Basic Usage

\`\`\`tsx
import { ${name} } from '@cloudflare/realtimekit-react-ui';

function MyComponent() {
  return <${name} />;
}
\`\`\`

`;

    if (props.length > 0) {
      content += `### With Properties

\`\`\`tsx
import { ${name} } from '@cloudflare/realtimekit-react-ui';

function MyComponent() {
  return (
    <${name}`;

      // Add example props (first 3 required props, excluding state-related props)
      const filteredProps = props.filter((p) => !p.name.toLowerCase().includes('state'));
      const exampleProps = filteredProps.filter((p) => p.required).slice(0, 3);
      if (exampleProps.length === 0) {
        // If no required props, show first 3 optional ones
        exampleProps.push(...filteredProps.slice(0, 3));
      }

      exampleProps.forEach((prop) => {
        const exampleValue = this.getReactValue(prop.type);
        content += `\n      ${prop.name}=${exampleValue}`;
      });

      content += `
    />
  );
}
\`\`\`

`;
    }

    return content;
  }

  generateAngularExample(component) {
    const { tagName, props = [] } = component;

    let content = `### Basic Usage

\`\`\`html
<!-- component.html -->
<${tagName}></${tagName}>
\`\`\`

`;

    if (props.length > 0) {
      content += `### With Properties

\`\`\`html
<!-- component.html -->
<${tagName}`;

      // Add example props (first 3 required props, excluding state-related props)
      const filteredProps = props.filter((p) => !p.name.toLowerCase().includes('state'));
      const exampleProps = filteredProps.filter((p) => p.required).slice(0, 3);
      if (exampleProps.length === 0) {
        // If no required props, show first 3 optional ones
        exampleProps.push(...filteredProps.slice(0, 3));
      }

      exampleProps.forEach((prop) => {
        const exampleValue = this.getAngularValue(prop.name, prop.type);
        content += `\n ${exampleValue}`;
      });

      content += `>
</${tagName}>
\`\`\`

`;
    }

    return content;
  }

  getReactValue(type) {
    const lowerType = type.toLowerCase();

    if (lowerType.includes('string')) {
      return '"example"';
    } else if (lowerType.includes('boolean')) {
      return '{true}';
    } else if (lowerType.includes('number')) {
      return '{42}';
    } else if (lowerType.includes('function') || lowerType.includes('=>')) {
      return '{handleEvent}';
    } else if (lowerType.includes('[]') || lowerType.includes('array')) {
      return '{[]}';
    } else if (lowerType.includes('object') || lowerType.includes('{')) {
      return '{{}}';
    } else if (lowerType.includes('meeting')) {
      return '{meeting}';
    } else if (lowerType.includes('size')) {
      return '"md"';
    } else if (lowerType.includes('uiconfig')) {
      return '{defaultUiConfig}';
    } else if (lowerType.includes('iconpack')) {
      return '{defaultIconPack}';
    } else if (lowerType.includes('peer')) {
      return '{participant}';
    } else if (lowerType.includes('controlbarvariant')) {
      return '"button"';
    } else if (lowerType.includes('iconvariant')) {
      return '"primary"';
    } else if (lowerType.includes('avatarvariant')) {
      return '"circular"';
    } else if (lowerType.includes('viewercountvariant')) {
      return '"primary"';
    }
    return `{${lowerType}}`;
  }

  getAngularValue(prop, type) {
    const lowerType = type.toLowerCase();

    if (lowerType.includes('string')) {
      return `${prop}="example"`;
    } else if (lowerType.includes('boolean')) {
      return `[${prop}]="true"`;
    } else if (lowerType.includes('number')) {
      return `${prop}="42"`;
    } else if (lowerType.includes('function') || lowerType.includes('=>')) {
      return `${prop}="handleEvent"`;
    } else if (lowerType.includes('[]') || lowerType.includes('array')) {
      return `[${prop}]="[]"`;
    } else if (lowerType.includes('object') || lowerType.includes('{')) {
      return `[${prop}=]"{}"`;
    } else if (lowerType.includes('meeting')) {
      return `[${prop}]="meeting"`;
    } else if (lowerType.includes('size')) {
      return `${prop}="md"`;
    } else if (lowerType.includes('uiconfig')) {
      return `[${prop}]="defaultUiConfig"`;
    } else if (lowerType.includes('iconpack')) {
      return `[${prop}]="defaultIconPack"`;
    } else if (lowerType.includes('peer')) {
      return `[${prop}]="participant"`;
    } else if (lowerType.includes('controlbarvariant')) {
      return `${prop}="button"`;
    } else if (lowerType.includes('iconvariant')) {
      return `${prop}="primary"`;
    } else if (lowerType.includes('avatarvariant')) {
      return `${prop}="circular"`;
    } else if (lowerType.includes('viewercountvariant')) {
      return `${prop}="primary"`;
    }
    return `[${prop}]="${lowerType}"`;
  }

  getCoreValue(prop, type) {
    const lowerType = type.toLowerCase();

    if (lowerType.includes('string')) {
      return `\n ${prop}="example"`;
    } else if (lowerType.includes('size')) {
      return `\n ${prop}="md"`;
    } else if (lowerType.includes('controlbarvariant')) {
      return `\n ${prop}"button"`;
    } else if (lowerType.includes('iconvariant')) {
      return `\n ${prop}="primary"`;
    } else if (lowerType.includes('avatarvariant')) {
      return `\n ${prop}="circular"`;
    } else if (lowerType.includes('viewercountvariant')) {
      return `\n ${prop}="primary"`;
    }
    return '';
  }

  getCoreScript(prop, type) {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('boolean')) {
      return `\n  el.${prop}= true;`;
    } else if (lowerType.includes('number')) {
      return `\n  el.${prop}= 42;`;
    } else if (lowerType.includes('function') || lowerType.includes('=>')) {
      return `\n  el.${prop}= handleEvent;`;
    } else if (lowerType.includes('[]') || lowerType.includes('array')) {
      return `\n  el.${prop}= [];`;
    } else if (lowerType.includes('object') || lowerType.includes('{')) {
      return `\n  el.${prop}= {};`;
    } else if (lowerType.includes('meeting')) {
      return `\n  el.${prop}= meeting`;
    } else if (lowerType.includes('uiconfig')) {
      return `\n  el.${prop}= defaultUiConfig`;
    } else if (lowerType.includes('iconpack')) {
      return `\n  el.${prop}= defaultIconPack`;
    } else if (lowerType.includes('peer')) {
      return `\n  el.${prop}= participant`;
    }
    return '';
  }
}

// CLI execution
async function main() {
  const filePath = process.argv[2] || './packages/core/src/components.d.ts';
  const outputDir = process.argv[3] || './docs/core';
  const framework = process.argv[4] || null; // Optional framework override

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`📖 Parsing ${filePath}...`);
  if (framework) {
    console.log(`🎯 Framework: ${framework}`);
  }

  const generator = new StencilDocGenerator(filePath, outputDir, framework);
  await generator.parseFile();
  await generator.generateDocs();

  const docsRootDir = path.resolve(process.cwd(), 'docs');
  if (!fs.existsSync(docsRootDir)) {
    fs.mkdirSync(docsRootDir, { recursive: true });
  }

  const docsRootIndexContent = `---
pcx_content_type: navigation
title: Component Reference
sidebar:
  group:
    hideIndex: true
---
`;

  fs.writeFileSync(path.join(docsRootDir, 'index.mdx'), docsRootIndexContent);

  console.log(`📁 Documentation saved to: ${outputDir}`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { StencilDocGenerator };
