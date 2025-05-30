const fs = require('fs');
const { colorHexToToken, fontSizeToVariant, fontWeightToToken, cornerRadiusToToken } = require('./unifyMappings');

// Helper: convert Figma color to hex
function figmaColorToHex(color) {
  if (!color) return undefined;
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Extract size (example: width < 200 is 'sm', else 'md')
function extractSize(node) {
  // Prefer explicit Size from componentProperties if available
  if (node.componentProperties && node.componentProperties.Size && node.componentProperties.Size.value) {
    return node.componentProperties.Size.value;
  }
  // Fallback to width-based logic
  const width = node.absoluteBoundingBox?.width || 0;
  return width < 200 ? 'sm' : 'md';
}

// Extract padding and margin (example: use node.padding/margin or fallback)
function extractPadding(node) {
  if (node.padding) return { all: node.padding };
  return { all: '' };
}
function extractMargin(node) {
  if (node.margin) return { all: node.margin };
  return { all: '' };
}

// Extract border color and width
function extractBorderColor(node) {
  // Recursively search for the first stroke color in any child node
  if (node.strokes && node.strokes[0]?.color) {
    return colorHexToToken(figmaColorToHex(node.strokes[0].color)) || '';
  }
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      const color = extractBorderColor(child);
      if (color) return color;
    }
  }
  return '';
}
function extractBorderWidth(node) {
  if (node.strokeWeight) return { all: `border-${node.strokeWeight}` };
  return { all: '' };
}

// Extract border radius
function extractBorderRadius(node) {
  // Handles both uniform and per-corner radii
  if (typeof node.cornerRadius === 'number') {
    return { all: `rounded-${cornerRadiusToToken[node.cornerRadius] || node.cornerRadius}` };
  } else if (
    node.topLeftRadius !== undefined ||
    node.topRightRadius !== undefined ||
    node.bottomRightRadius !== undefined ||
    node.bottomLeftRadius !== undefined
  ) {
    return {
      topLeft: `rounded-tl-${cornerRadiusToToken[node.topLeftRadius] || node.topLeftRadius}`,
      topRight: `rounded-tr-${cornerRadiusToToken[node.topRightRadius] || node.topRightRadius}`,
      bottomRight: `rounded-br-${cornerRadiusToToken[node.bottomRightRadius] || node.bottomRightRadius}`,
      bottomLeft: `rounded-bl-${cornerRadiusToToken[node.bottomLeftRadius] || node.bottomLeftRadius}`
    };
  }
  return { all: '' };
}

// Extract width/height as Tailwind-like string
function extractWidth(node) {
  if (node.absoluteBoundingBox?.width)
    return `w-[${Math.round(node.absoluteBoundingBox.width)}px]`;
  return '';
}
function extractHeight(node) {
  if (node.absoluteBoundingBox?.height)
    return `h-[${Math.round(node.absoluteBoundingBox.height)}px]`;
  return '';
}

// Extract label and description text nodes
function extractLabelAndDescription(node) {
  let label = '';
  let description = '';
  function traverse(n) {
    if (n.type === 'TEXT' && n.characters) {
      if (!label) {
        label = n.characters;
      } else if (!description) {
        description = n.characters;
      }
    }
    if (n.children && n.children.length > 0) {
      for (const child of n.children) traverse(child);
    }
  }
  traverse(node);
  return { label, description };
}

// Extract defaultValue (first text node or empty)
function extractDefaultValue(node) {
  let value = '';
  function traverse(n) {
    if (n.type === 'TEXT' && n.characters && !value) value = n.characters;
    if (n.children && n.children.length > 0) {
      for (const child of n.children) traverse(child);
    }
  }
  traverse(node);
  return value;
}

// Extract appearance (label/description color, variant, weight)
function extractAppearanceFromFigma(node, figmaJson) {
  let description = { color: '', variant: '', weight: '' };
  let label = { color: '', variant: '', weight: '' };
  let foundLabel = false;
  let foundDescription = false;
  let secondTextColor = '';
  let secondTextVariant = '';
  let secondTextWeight = '';
  function searchForColorAndStyle(n) {
    // Label: first TEXT node (not supporting/description)
    if (!foundLabel && n.type === 'TEXT' && n.fills && n.fills.length > 0 && n.fills[0].color) {
      const hex = figmaColorToHex(n.fills[0].color);
      label.color = colorHexToToken(hex);
      if (n.style) {
        if (n.style.fontSize) label.variant = fontSizeToVariant[n.style.fontSize] || `text-${n.style.fontSize}`;
        if (n.style.fontWeight) label.weight = fontWeightToToken[n.style.fontWeight] || n.style.fontWeight;
      }
      foundLabel = true;
    } else if (!foundDescription && n.type === 'TEXT' && n.fills && n.fills.length > 0 && n.fills[0].color) {
      // Save the color, variant, and weight of the second TEXT node as a fallback for description
      const hex = figmaColorToHex(n.fills[0].color);
      secondTextColor = colorHexToToken(hex);
      if (n.style) {
        if (n.style.fontSize) secondTextVariant = fontSizeToVariant[n.style.fontSize] || `text-${n.style.fontSize}`;
        if (n.style.fontWeight) secondTextWeight = fontWeightToToken[n.style.fontWeight] || n.style.fontWeight;
      }
    }
    // Description: supporting text node (restore logic)
    if (!foundDescription && n.type === 'TEXT' && n.name && n.name.toLowerCase().includes('support') && n.fills && n.fills.length > 0 && n.fills[0].color) {
      const hex = figmaColorToHex(n.fills[0].color);
      description.color = colorHexToToken(hex);
      if (n.style) {
        if (n.style.fontSize) description.variant = fontSizeToVariant[n.style.fontSize] || `text-${n.style.fontSize}`;
        if (n.style.fontWeight) description.weight = fontWeightToToken[n.style.fontWeight] || n.style.fontWeight;
      }
      foundDescription = true;
    }
    if (n.children && n.children.length > 0) {
      for (const child of n.children) searchForColorAndStyle(child);
    }
  }
  searchForColorAndStyle(node);
  // Fallback: if no supporting text node, use the color, variant, and weight of the second TEXT node if available
  if (!description.color && secondTextColor) {
    description.color = secondTextColor;
  }
  if (!description.variant && secondTextVariant) {
    description.variant = secondTextVariant;
  }
  if (!description.weight && secondTextWeight) {
    description.weight = secondTextWeight;
  }
  return { description, label };
}

// Main mapping function
function mapFigmaNodeToUnify(node, figmaJson) {
  const unifyId = `b_${node.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const { label, description } = extractLabelAndDescription(node);
  const appearanceExtracted = extractAppearanceFromFigma(node, figmaJson);
  return {
    [unifyId]: {
      component: {
        componentType: node.componentProperties?.Type?.value === 'Radio' ? 'RadioButton' : 'Unknown',
        appearance: {
          size: extractSize(node),
          description: appearanceExtracted.description,
          styles: {
            padding: extractPadding(node),
            margin: extractMargin(node),
            borderColor: extractBorderColor(node),
            borderWidth: extractBorderWidth(node),
            borderRadius: extractBorderRadius(node),
            width: extractWidth(node),
            height: extractHeight(node)
          },
          label: appearanceExtracted.label
        },
        content: {
          defaultValue: extractDefaultValue(node),
          description: description,
          label: label || node.name || 'New Radio Button'
        }
      },
      visibility: { value: node.visible !== undefined ? node.visible : true },
      dpOn: [],
      displayName: node.name || 'RadioButton_1',
      dataSourceIds: [],
      id: unifyId,
      parentId: 'root_id'
    }
  };
}

async function main() {
  try {
    // Read local figma.json
    const figmaJson = JSON.parse(fs.readFileSync('figma.json', 'utf8'));
    const nodes = figmaJson?.Result?.nodes || {};
    const nodeIds = Object.keys(nodes);
    if (nodeIds.length === 0) throw new Error('No nodes found in Figma JSON');
    const node = nodes[nodeIds[0]]?.document;
    if (!node) throw new Error('Node not found in Figma JSON');
    const unifyJson = mapFigmaNodeToUnify(node, figmaJson);
    fs.writeFileSync('unify.json', JSON.stringify(unifyJson, null, 2));
    console.log('Unify JSON saved to unify.json');
  } catch (error) {
    console.error('Error fetching or processing Figma JSON:', error.message);
  }
}

main();