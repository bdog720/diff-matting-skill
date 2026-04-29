# Difference Matting Tool
This tool extracts a high-quality alpha channel (transparency) from an image by comparing two versions of the same subject: one on a solid white background and one on a solid black background.

This technique is particularly useful for AI-generated assets where the model can generate the subject on specific backgrounds but struggles to output true alpha transparency.

## How it Works
The script uses the formula:
`Alpha = 1 - (Image_White - Image_Black)`

By comparing the two images, we can determine exactly which pixels belong to the background and which are part of the subject, even for semi-transparent edges.

## Requirements
- Python 3.x
- Pillow (`pip install Pillow`)
- NumPy (`pip install numpy`)

## Usage
1. **Prepare your images**:
   - Generate or create your subject on a **pure white (#FFFFFF)** background.
   - Generate or create the **exact same** subject on a **pure black (#000000)** background.
   - Ensure they are the same dimensions and the subject is in the same position.

2. **Run the script**:
   ```bash
   python3 diff_matting.py --white path/to/white.png --black path/to/black.png --output result.png
   ```

## Options
- `--white`: Path to the image with a white background.
- `--black`: Path to the image with a black background.
- `--output`: Path to save the resulting transparent PNG.
- `--erode`: (Optional) Amount of pixels to erode the mask by to remove halos (default: 0).
- `--threshold`: (Optional) Alpha thresholding to sharpen edges (default: 0.0).

## Tips for AI Generation
To get the best results with tools like DALL-E, Midjourney, or Stable Diffusion:
1. Use an "Image-to-Image" or "Edit" feature.
2. First, get your subject on a white background.
3. Use that result as the input to generate the same subject on a black background, instructing the model to *only* change the background color.
