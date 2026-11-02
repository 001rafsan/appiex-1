from PIL import Image
import numpy as np

src_path = r"C:\Users\SOWDA\.gemini\antigravity\brain\c35dee48-d2fc-4b77-b7a4-05c6961ff70f\.user_uploaded\media_1792180983897_84e7cfc7.jpg"
img = Image.open(src_path).convert("RGBA")

# Invert luminosity: black letters become white, white bg becomes transparent alpha
arr = np.array(img)
# grayscale value
gray = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]

# Alpha is inverted grayscale: black (0) -> alpha 255; white (255) -> alpha 0
alpha = 255.0 - gray
# Apply slight contrast curve to clean noise
alpha = np.clip((alpha - 15) * (255.0 / (255.0 - 30)), 0, 255).astype(np.uint8)

# Output image is pure white with this alpha channel
out_arr = np.zeros_like(arr)
out_arr[:, :, 0] = 255
out_arr[:, :, 1] = 255
out_arr[:, :, 2] = 255
out_arr[:, :, 3] = alpha

out_img = Image.fromarray(out_arr)

# Crop tight to the bounding box of non-transparent pixels
bbox = out_img.getbbox()
print("BBox:", bbox)
cropped = out_img.crop(bbox)

# Add small padding
pad = 20
padded = Image.new("RGBA", (cropped.width + pad * 2, cropped.height + pad * 2), (255, 255, 255, 0))
padded.paste(cropped, (pad, pad))

out_path = r"c:\Users\SOWDA\Downloads\csetech.diu.edu.b\images\appiex-wordmark-white.png"
padded.save(out_path, "PNG")
print("Saved to:", out_path, "Size:", padded.size)
