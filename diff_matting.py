import argparse
import numpy as np
from PIL import Image, ImageFilter
import os
import sys

def process_diff_matting(white_path, black_path, output_path, erode=0, threshold=0.0):
    if not os.path.exists(white_path):
        print(f"Error: White background image not found at {white_path}")
        return
    if not os.path.exists(black_path):
        print(f"Error: Black background image not found at {black_path}")
        return

    # Load images
    white_img = Image.open(white_path).convert("RGB")
    black_img = Image.open(black_path).convert("RGB")
    
    # Resize black to match white if dimensions differ
    if white_img.size != black_img.size:
        print(f"Warning: Dimensions mismatch. Resizing {black_path} ({black_img.size}) to match {white_path} ({white_img.size})")
        black_img = black_img.resize(white_img.size, Image.Resampling.LANCZOS)
    
    w = np.array(white_img, dtype=float) / 255.0
    b = np.array(black_img, dtype=float) / 255.0
    
    # Alpha calculation: 1 - (W - B)
    # This detects the background (where W is 1 and B is 0) and sets alpha to 0.
    # Where W and B are identical (the subject), alpha is 1.
    diff = np.clip(w - b, 0, 1)
    alpha = 1.0 - np.max(diff, axis=2)
    
    # Apply thresholding if requested
    if threshold > 0:
        alpha = np.clip((alpha - threshold) / (1.0 - threshold), 0, 1)
    
    # Apply erosion if requested to remove edge halos
    if erode > 0:
        alpha_pil = Image.fromarray((alpha * 255).astype(np.uint8), mode='L')
        # MinFilter acts as erosion for grayscale masks
        alpha_pil = alpha_pil.filter(ImageFilter.MinFilter(erode * 2 + 1))
        alpha = np.array(alpha_pil, dtype=float) / 255.0
    
    # Combine colors and alpha
    # We use the black-background version for colors because it has no white bleed
    result = np.zeros((w.shape[0], w.shape[1], 4))
    result[..., :3] = b
    result[..., 3] = alpha
    
    # Convert to uint8 and save
    result_uint8 = (np.clip(result, 0, 1) * 255).astype(np.uint8)
    out_img = Image.fromarray(result_uint8, "RGBA")
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    out_img.save(output_path, "PNG")
    print(f"Successfully saved transparent image to: {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Extract transparency using Difference Matting (White/Black background comparison).")
    parser.add_argument("--white", required=True, help="Path to image on pure white background")
    parser.add_argument("--black", required=True, help="Path to image on pure black background")
    parser.add_argument("--output", required=True, help="Path to save the transparent result")
    parser.add_argument("--erode", type=int, default=0, help="Erosion radius to remove edge halos (default: 0)")
    parser.add_argument("--threshold", type=float, default=0.0, help="Alpha threshold (0.0 to 1.0) to sharpen edges")

    args = parser.parse_args()
    
    try:
        process_diff_matting(args.white, args.black, args.output, args.erode, args.threshold)
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
