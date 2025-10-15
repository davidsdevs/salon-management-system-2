# Team Images Directory

This directory contains all the team member photos for David's Salon About page.

## Folder Structure

```
public/images/team/
├── executives/          # Executive team photos
├── management/          # Management team photos
├── stylists/           # Stylist team photos
└── README.md          # This file
```

## Team Members

Based on the About page, here are the team members who need photos:

### Executive Team:
- **Marivic Aguibiador** - Executive Vice President for Finance and Operations
- **Maria Luisa Flores** - Vice President for Human Resources
- **Jeng Sy** - [Position not specified]
- **Lorna Sandoval** - [Position not specified]
- **Hanna Riñon de Grano** - [Position not specified]

## Image Guidelines

### Recommended Image Specifications:
- **Format**: JPG or PNG
- **Resolution**: Minimum 400x400px, preferably 600x600px or higher
- **File Size**: Keep under 1MB per image for optimal loading
- **Aspect Ratio**: 1:1 (square) for consistent display
- **Background**: Professional headshot with clean background

### Naming Convention:
- Use the person's full name: `marivic-aguibiador.jpg`
- Use hyphens instead of spaces
- Use lowercase letters
- Include file extension: `.jpg` or `.png`

### Example File Names:
- `marivic-aguibiador.jpg`
- `maria-luisa-flores.jpg`
- `jeng-sy.jpg`
- `lorna-sandoval.jpg`
- `hanna-rinon-de-grano.jpg`

## How to Add Images:

1. Place team member photos in the appropriate subfolder
2. Follow the naming convention
3. Update the About page component to reference your images
4. Use the path: `/images/team/[filename]`

## Example Usage in Code:

```jsx
{
  name: "Marivic Aguibiador",
  position: "Executive Vice President for Finance and Operations",
  image: "/images/team/marivic-aguibiador.jpg"
}
```

## Notes:
- All images will be automatically optimized by the build process
- Images are served from the public directory
- Make sure to backup your original high-resolution images
- Consider creating web-optimized versions for faster loading
- Professional headshots work best for team pages
