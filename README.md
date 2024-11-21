# Tailwind CSS JIT px-to-rem Converter

## Installation

```bash
npm install @chan/tailwindcss-jit-px-to-rem
# or
yarn add @chan/tailwindcss-jit-px-to-rem
```

## Configuration

Add the plugin to your `tailwind.config.js`:

```js
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {},
  },
  plugins: [
    tailwindPxToRemPlugin({
      // Maximum px value to convert
      maxPxValue: 1500,

      // Property aliases configuration
      propertyAliases: {
        // 'mt': 'margin-top',
        // 'mb': 'margin-bottom',
      },

      // Breakpoint settings
      breakpoints: {
        // sm: 640,
        // md: 768,
        // lg: 1024,
        // xl: 1280,
      },
      full: false // default
    })
  ],
}
```

## Usage

The plugin automatically converts dynamic classes that match the `maxPxValue`, `propertyAliases`, and `breakpoints` configurations to rem units.

### Examples

```html
<!-- 16px will be converted to 1rem -->
<div class="mt-[16px]">Hello World!</div>

<!-- 2px will be converted to 0.125rem -->
<div class="-top-[2px]">Hello World!</div>
```
