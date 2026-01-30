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

  detectLibraryName(filePath) {
    if (filePath.includes('/core/')) return 'Core';
    if (filePath.includes('/react/')) return 'React';
    if (filePath.includes('/angular/')) return 'Angular';
    return 'Unknown';
  }

  formatFrameworkName(framework) {
    switch (framework.toLowerCase()) {
      case 'core':
        return 'Core';
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
    const propRegex = /\/\*\*\s*\n\s*\*\s*(.*?)\s*\n\s*\*\/\s*\n\s*"([^"]+)":\s*([^;]+);/g;

    let match;
    while ((match = propRegex.exec(propsContent)) !== null) {
      const [, description, name, typeWithDefault] = match;

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
    const components = Array.from(this.components.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    let content = `---
title: ${this.libraryName} Components API Reference
description: Complete API reference for ${this.libraryName} library components
---

# ${this.libraryName} Components API Reference

Auto-generated from \`${path.basename(this.filePath)}\` - ${new Date().toISOString()}

## Available Components

`;

    components.forEach((component) => {
      const propCount = component.props?.length || 0;
      const eventCount = component.events?.length || 0;

      content += `### [${component.name}](./${component.tagName})

      - **Tag:** \`<${component.tagName}>\`
      - **Props:** ${propCount}
      - **Events:** ${eventCount}

      `;
    });

    content += `
      ## Component Overview

      | Component | Tag Name | Props | Events |
      |-----------|----------|-------|--------|
      `;

    components.forEach((component) => {
      const propCount = component.props?.length || 0;
      const eventCount = component.events?.length || 0;

      content += `| [${component.name}](./${component.tagName}) | \`<${component.tagName}>\` | ${propCount} | ${eventCount} |\n`;
    });

    fs.writeFileSync(path.join(this.outputDir, 'index.mdx'), content);
  }

  async generateComponentDoc(component) {
    const { name, tagName, props = [], events = [], description } = component;

    let content = `---
title: ${name}
description: API reference for ${name} component (${this.libraryName} Library)
---

# ${name}

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
        const defaultValue = prop.defaultValue ? `\`${prop.defaultValue}\`` : '-';

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
    if (type.length > 50) {
      return `\`${type.substring(0, 47)}...\``;
    }
    return `\`${type}\``;
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
        const exampleValue = this.getExampleValue(prop.type);
        content += `\n  ${prop.name}=${exampleValue}`;
      });

      content += `>
</${tagName}>
\`\`\`

`;
    }

    return content;
  }

  generateReactExample(component) {
    const { name, props = [] } = component;

    let content = `### Basic Usage

\`\`\`tsx
import { ${name} } from '@cloudflare/realtimekit-ui/react';

function MyComponent() {
  return <${name} />;
}
\`\`\`

`;

    if (props.length > 0) {
      content += `### With Properties

\`\`\`tsx
import { ${name} } from '@cloudflare/realtimekit-ui/react';

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
        const exampleValue = this.getExampleValue(prop.type, true);
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
    const { name, tagName, props = [] } = component;

    let content = `### Setup

\`\`\`typescript
// app.module.ts
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { defineCustomElements } from '@cloudflare/realtimekit-ui/loader';

defineCustomElements();

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
\`\`\`

### Basic Usage

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
        const exampleValue = this.getExampleValue(prop.type);
        content += `\n  [${prop.name}]=${exampleValue}`;
      });

      content += `>
</${tagName}>
\`\`\`

`;
    }

    return content;
  }

  getExampleValue(type, isReact = false) {
    const lowerType = type.toLowerCase();

    if (lowerType.includes('string')) {
      return '"example"';
    } else if (lowerType.includes('boolean')) {
      return isReact ? '{true}' : 'true';
    } else if (lowerType.includes('number')) {
      return isReact ? '{42}' : '42';
    } else if (lowerType.includes('function') || lowerType.includes('=>')) {
      return isReact ? '{handleEvent}' : 'handleEvent';
    } else if (lowerType.includes('[]') || lowerType.includes('array')) {
      return isReact ? '{[]}' : '[]';
    } else if (lowerType.includes('object') || lowerType.includes('{')) {
      return isReact ? '{{}}' : '{}';
    } else if (lowerType.includes('meeting')) {
      return '{meeting}';
    } else if (lowerType.includes('size')) {
      return '"md"';
    } else if (lowerType.includes('uiconfig')) {
      return '{defaultUiConfig}';
    } else if (lowerType.includes('iconpack')) {
      return "{'defaultIconPack'}";
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
    return isReact ? `{${lowerType}}` : `${lowerType}`;
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

  console.log(`📁 Documentation saved to: ${outputDir}`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { StencilDocGenerator };
