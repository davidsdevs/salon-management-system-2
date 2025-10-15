# Branch Images Directory

This directory contains all the branch images for David's Salon branch listings and cards.

## Folder Structure

```
public/images/branches/
├── harbor-point-ayala/    # Harbor Point Ayala branch images
├── exterior/              # Branch exterior photos
├── interior/              # Branch interior photos
└── README.md             # This file
```

## Current Branch

### Harbor Point Ayala Branch
- **Location:** Ground Floor Harbor Point Subic, Subic, Philippines
- **Phone:** 0992 586 5758
- **Image Folder:** `harbor-point-ayala/`

## Image Guidelines

### Recommended Image Specifications:
- **Format**: JPG or PNG
- **Resolution**: Minimum 800x600px, preferably 1200x800px or higher
- **File Size**: Keep under 2MB per image for optimal loading
- **Aspect Ratio**: 16:9 or 4:3 for best display in branch cards
- **Quality**: High-resolution, professional photos

### Naming Convention:
- Use descriptive names: `harbor-point-exterior.jpg`
- Include branch name prefix: `harbor-point-ayala-interior.jpg`
- Use hyphens instead of spaces
- Include file extension: `.jpg` or `.png`

### Example File Names:
- `harbor-point-exterior.jpg` - Branch exterior view
- `harbor-point-interior.jpg` - Branch interior view
- `harbor-point-reception.jpg` - Reception area
- `harbor-point-styling-area.jpg` - Styling stations

## Image Categories

### Exterior Images (`exterior/`)
- Branch building exterior
- Storefront and signage
- Parking area
- Street view of the branch

### Interior Images (`interior/`)
- Reception area
- Styling stations
- Waiting area
- Product displays
- Overall salon ambiance

## How to Add Images:

1. Place branch images in the appropriate folder
2. Follow the naming convention
3. Update the branch data in the code to reference your images
4. Use the path: `/images/branches/[filename]`

## Example Usage in Code:

```jsx
{
  name: "Harbor Point Ayala",
  slug: "harbor-point-ayala",
  location: "Ground Floor Harbor Point Subic, Subic, Philippines",
  phone: "0992 586 5758",
  image: "/images/branches/harbor-point-exterior.jpg"
}
```

## Notes:
- All images will be automatically optimized by the build process
- Images are served from the public directory
- Make sure to backup your original high-resolution images
- Consider creating web-optimized versions for faster loading
- Professional photos work best for branch listings
