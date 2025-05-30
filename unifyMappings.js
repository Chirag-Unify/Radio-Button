// This file contains mappings for color hex codes to Unify color tokens and font sizes to Unify variants.

const colorHexToToken = {
  '#ffffff': 'text-primary',
  '#000000': 'text-secondary',
  '#f5f5f5': 'text-tertiary',
  '#e0e0e0': 'text-disabled',
  '#ff0000': 'text-error',
  '#00ff00': 'text-success',
  '#0000ff': 'text-info',
  '#f44336': 'text-error',
  '#4caf50': 'text-success',
  '#2196f3': 'text-info',
  '#9e9e9e': 'text-muted',
  '#bdbdbd': 'text-placeholder',
  '#212121': 'text-title',
  '#757575': 'text-body',
  '#3f51b5': 'text-link',
  '#1e88e5': 'text-link-hover',
  '#c62828': 'text-danger',
  '#43a047': 'text-success-dark',
  '#1565c0': 'text-info-dark',
  '#ffeb3b': 'text-warning',
  '#ffc107': 'text-warning-dark',
  '#ff9800': 'text-accent',
  '#795548': 'text-brown',
  '#607d8b': 'text-blue-grey',
  '#8bc34a': 'text-light-green',
  '#00bcd4': 'text-cyan',
  '#e91e63': 'text-pink',
  '#9c27b0': 'text-purple',
  '#673ab7': 'text-deep-purple',
  '#ff5722': 'text-deep-orange',
  '#cddc39': 'text-lime',
  '#ffb300': 'text-amber',
  '#fbc02d': 'text-amber-dark',
  '#d32f2f': 'text-error-dark',
  '#388e3c': 'text-success-darker',
  '#1976d2': 'text-info-darker',
  '#616161': 'text-grey',
  '#424242': 'text-grey-dark',
  '#fafafa': 'text-background',
  '#eeeeee': 'text-background-light',
  '#263238': 'text-background-dark',
  '#ff6d00': 'warning-800',
  '#ff8f00': 'warning-700',
  '#ffa000': 'warning-600',
  '#ffc107': 'warning-500',
  '#ffca28': 'warning-400',
  '#ffd54f': 'warning-300',
  '#ffe082': 'warning-200',
  '#ffecb3': 'warning-100',
  // Add more mappings as needed
};

function colorHexToTokenFunc(hex) {
  if (!hex) return '';
  const key = hex.toLowerCase();
  return colorHexToToken[key] || hex;
}

const fontSizeToVariant = {
  10: 'text-xxxs',
  12: 'text-xxs',
  14: 'text-xs',
  16: 'text-sm',
  18: 'text-md',
  20: 'text-lg',
  24: 'text-xl',
  32: 'text-xxl',
  40: 'text-xxxl',
  16: 'body-4',
  18: 'body-3',
  20: 'body-2',
  24: 'body-1',
  12: 'code-2',
  14: 'code-1',
  // Add more as needed
};

const fontWeightToToken = {
  100: 'thin',
  200: 'extra-light',
  300: 'light',
  400: 'regular',
  500: 'medium',
  600: 'semi-bold',
  700: 'bold',
  800: 'extra-bold',
  900: 'black',
  'normal': 'regular',
  'bold': 'bold',
  // Add more as needed
};

const cornerRadiusToToken = {
  0: 'none',
  2: 'xs',
  4: 'sm',
  6: 'md',
  8: 'lg',
  12: 'xl',
  16: '2xl',
  24: '3xl',
  32: '4xl',
  'pill': 'pill'
};

const spacingToToken = {
  0: 'none',
  2: '0.5',
  4: '1',
  8: '2',
  12: '3',
  16: '4',
  20: '5',
  24: '6',
  32: '8',
  40: '10',
  48: '12',
  56: '14',
  64: '16',
  auto: 'auto'
};

module.exports = {
  colorHexToToken: colorHexToTokenFunc,
  fontSizeToVariant,
  fontWeightToToken,
  cornerRadiusToToken,
  spacingToToken
};
