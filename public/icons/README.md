# TripFlow PWA Icons

## Required Icon Sizes

The following icon files need to be placed in this directory for the PWA to work properly:

- `icon-72x72.png` - 72x72px
- `icon-96x96.png` - 96x96px
- `icon-128x128.png` - 128x128px
- `icon-144x144.png` - 144x144px
- `icon-152x152.png` - 152x152px
- `icon-192x192.png` - 192x192px (Android home screen)
- `icon-384x384.png` - 384x384px
- `icon-512x512.png` - 512x512px (Splash screen)

## How to Generate Icons

### Option 1: Use a PWA Icon Generator

Visit https://www.pwabuilder.com/imageGenerator or https://realfavicongenerator.net/

1. Upload a high-resolution logo (1024x1024px recommended)
2. Generate all required sizes
3. Download and place them in this directory

### Option 2: Use ImageMagick (Command Line)

If you have a source image `logo.png`:

```bash
# Install ImageMagick first if needed: brew install imagemagick
convert logo.png -resize 72x72 icon-72x72.png
convert logo.png -resize 96x96 icon-96x96.png
convert logo.png -resize 128x128 icon-128x128.png
convert logo.png -resize 144x144 icon-144x144.png
convert logo.png -resize 152x152 icon-152x152.png
convert logo.png -resize 192x192 icon-192x192.png
convert logo.png -resize 384x384 icon-384x384.png
convert logo.png -resize 512x512 icon-512x512.png
```

### Option 3: Use Node.js Script

Create a script to generate all sizes from a source image:

```bash
npm install -D sharp
```

Then create `scripts/generate-icons.js`:

```javascript
const sharp = require('sharp');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  sharp('logo-source.png')
    .resize(size, size)
    .toFile(`public/icons/icon-${size}x${size}.png`)
    .then(() => console.log(`Generated ${size}x${size}`))
    .catch(err => console.error(err));
});
```

## Design Guidelines

- **Background**: Use a solid color or simple gradient
- **Icon**: Keep it simple and recognizable at small sizes
- **Padding**: Leave 10-15% padding around the icon
- **Safe Zone**: Keep important content in the center 80%
- **Maskable**: For 192x192 and 512x512, ensure the icon looks good when masked

## TripFlow Branding

Current theme color: `#3B82F6` (blue)

Suggested icon design:
- Luggage/suitcase icon
- Travel-themed symbol
- Simple, flat design
- High contrast for visibility

## Testing

After adding icons, test the PWA:
1. Run `npm run build`
2. Run `npm run preview`
3. Open Chrome DevTools → Application → Manifest
4. Verify all icons load correctly
