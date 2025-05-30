const fs = require('fs');
const axios = require('axios');
const { colorHexToToken, fontSizeToVariant, fontWeightToToken } = require('./unifyMappings');

const FIGMA_URL = 'https://api.qa.unifyapps.com/api-endpoint/figma/Fetch-Figma-Details';
const FILE_URL = 'https://www.figma.com/design/huI2r4FfZauzyQRfwb2sTs/Untitled?node-id=5-67&t=nafiDHsCG1ytZJ0d-4';

function mapComponentProperties(props) {
  const mapped = {};
  for (const [key, value] of Object.entries(props || {})) {
    mapped[key] = value.value;
  }
  return mapped;
}
function extractAppearanceFromFigma(node, figmaJson) {
  // Helper to convert Figma color to hex
  function figmaColorToHex(color) {
    if (!color) return undefined;
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  // Helper to resolve styleId to style name
  function resolveStyleName(styleId) {
    if (!styleId) return undefined;
    const styles = figmaJson?.Result?.styles || {};
    if (styles[styleId]) return styles[styleId].name;
    return undefined;
  }

  let description = {
    color: undefined,
    variant: undefined,
    weight: undefined
  };
  let label = {
    color: undefined,
    variant: undefined,
    weight: undefined
  };

  // Try to extract from node or children
  function searchForColorAndStyle(n) {
    // Fills
    if (n.fills && n.fills.length > 0 && n.fills[0].color) {
      const hex = figmaColorToHex(n.fills[0].color);
      description.color = colorHexToToken[hex] || hex;
      // Try to resolve style name if present
      if (n.styles && n.styles.fill) {
        description.color = resolveStyleName(n.styles.fill) || description.color;
      }
    }
    // Strokes
    if (n.strokes && n.strokes.length > 0 && n.strokes[0].color) {
      const hex = figmaColorToHex(n.strokes[0].color);
      label.color = colorHexToToken[hex] || hex;
      if (n.styles && n.styles.stroke) {
        label.color = resolveStyleName(n.styles.stroke) || label.color;
      }
    }
    // Variant and weight: try to extract from text node
    if (n.type === 'TEXT' && n.style) {
      if (n.style.fontSize) {
        label.variant = fontSizeToVariant[n.style.fontSize] || `text-${n.style.fontSize}`;
      }
      if (n.style.fontWeight) {
        label.weight = fontWeightToToken[n.style.fontWeight] || n.style.fontWeight;
      }
    }
    // Recursively check children
    if (n.children && n.children.length > 0) {
      for (const child of n.children) {
        searchForColorAndStyle(child);
      }
    }
  }
  searchForColorAndStyle(node);

  // Fallbacks
  if (!description.color) description.color = 'tet-secondary';
  if (!description.variant) description.variant = 'tet-xxs';
  if (!description.weight) description.weight = 'reglar';
  if (!label.color) label.color = 'tet-primary';
  if (!label.variant) label.variant = 'tet-sm';
  if (!label.weight) label.weight = 'medim';
  return { description, label };
}

function extractLabelAndDescription(node) {
  let label = undefined;
  let description = undefined;
  // Recursively search for TEXT nodes
  function traverse(n) {
    if (n.type === 'TEXT' && n.characters) {
      if (!label) {
        label = n.name || n.characters;
        description = n.characters;
      } else if (!description) {
        description = n.characters;
      }
    }
    if (n.children && n.children.length > 0) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }
  traverse(node);
  return { label, description };
}

function mapFigmaNodeToUnify(node, figmaJson) {
  const unifyId = `b_${node.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const appearance = extractAppearanceFromFigma(node, figmaJson);
  const { label, description } = extractLabelAndDescription(node);
  return {
    [unifyId]: {
      component: {
        componentType: node.componentProperties?.Type?.value === 'Radio' ? 'RadioButton' : 'Unknown',
        appearance,
        content: {
          label: label || node.name || 'New Radio Button',
          ...(description ? { description } : {})
        }
      },
      visibility: {
        value: true
      },
      dpOn: [],
      displayName: 'RadioButton_1',
      id: unifyId,
      parentId: 'root_id'
    }
  };
}

async function main() {
  try {
    // Fetch Figma JSON directly
    const response = await axios.post(FIGMA_URL, {
      fileUrl: FILE_URL
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    const figmaJson = response.data;
    // Automatically get the first nodeId from the Figma JSON
    const nodes = figmaJson?.Result?.nodes || {};
    const nodeIds = Object.keys(nodes);
    if (nodeIds.length === 0) {
      throw new Error('No nodes found in Figma JSON');
    }
    const node = nodes[nodeIds[0]]?.document;
    if (!node) {
      throw new Error('Node not found in Figma JSON');
    }
    const unifyJson = mapFigmaNodeToUnify(node, figmaJson);
    fs.writeFileSync('unify.json', JSON.stringify(unifyJson, null, 2));
    console.log('Unify JSON saved to unify.json');
  } catch (error) {
    console.error('Error fetching or processing Figma JSON:', error.message);
  }
}

main();