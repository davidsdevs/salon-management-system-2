# Gallery Images Directory

This directory contains all the gallery images for David's Salon Harbor Point Ayala branch.

## Folder Structure

```
public/images/gallery/
├── hair-transformations/     # Before/after hair transformation photos
├── salon-interior/          # Salon space and interior photos
├── color-work/              # Hair coloring and highlighting work
├── styling/                 # Hair styling and cuts
├── services/                # Service-specific output images
└── README.md               # This file
```

## Image Guidelines

### Recommended Image Specifications:
- **Format**: JPG or PNG
- **Resolution**: Minimum 800x600px, preferably 1200x800px or higher
- **File Size**: Keep under 2MB per image for optimal loading
- **Aspect Ratio**: 4:3 or 16:9 for best display

### Naming Convention:
- Use descriptive names: `balayage-transformation-01.jpg`
- Include category prefix: `color-work-highlights-02.jpg`
- Use hyphens instead of spaces
- Number multiple images: `styling-bob-cut-01.jpg`, `styling-bob-cut-02.jpg`

### Categories:

#### Hair Transformations (`hair-transformations/`)
- Before and after photos
- Complete hair makeovers
- Color changes
- Length changes
- Style transformations

#### Salon Interior (`salon-interior/`)
- Salon space photos
- Work stations
- Waiting area
- Reception area
- Overall salon ambiance

#### Color Work (`color-work/`)
- Hair coloring results
- Highlights and lowlights
- Balayage work
- Ombre effects
- Color corrections

#### Styling (`styling/`)
- Hair cuts and styles
- Blowouts
- Updos
- Special occasion hair
- Trendy styles

#### Services (`services/`)
- Cut, Shampoo and Blowdry results
- Balayage service outcomes
- Keratin treatment results
- Hair coloring service outputs
- Treatment before/after photos
- Service-specific transformations

## How to Add Images:

1. Place your images in the appropriate category folder
2. Follow the naming convention
3. Update the gallery data in `src/BranchGalleryPage.jsx` to reference your images
4. Use the path: `/images/gallery/[category]/[filename]`

## Example Usage in Code:

```jsx
{
  id: 1,
  category: "Hair Transformation",
  title: "Balayage Transformation",
  description: "Beautiful balayage work by Maria Santos",
  stylist: "Maria Santos",
  image: "/images/gallery/hair-transformations/balayage-01.jpg",
  tag: "Hair Transformation"
}
```

## Notes:
- All images will be automatically optimized by the build process
- Images are served from the public directory
- Make sure to backup your original high-resolution images
- Consider creating web-optimized versions for faster loading
