"""
Techie Contact QR Code Generator
─────────────────────────────────
Generates a stylish QR code with:
• Rounded modules with gradient-like color
• Centered logo/initials overlay
• Neon glow effect on dark background
• Rounded finder eyes (the 3 corner squares)
• Contact info footer strip

Requires: pip install qrcode[pil] Pillow
"""

import qrcode
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import os


def create_tech_contact_qr():
    print("┌─────────────────────────────────────────────┐")
    print("│   ⚡ Techie Contact QR Code Generator ⚡    │")
    print("└─────────────────────────────────────────────┘\n")

    # Collect inputs
    first_name = input("  First Name: ").strip()
    last_name = input("  Last Name: ").strip()
    mobile = input("  Mobile (+country code): ").strip()
    email = input("  Email: ").strip()
    linkedin = input("  LinkedIn URL: ").strip()
    title = input("  Job Title (optional): ").strip()
    company = input("  Company (optional): ").strip()

    # Build vCard 3.0
    vcard_lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        f"N:{last_name};{first_name};;;",
        f"FN:{first_name} {last_name}",
        f"TEL;TYPE=CELL:{mobile}",
        f"EMAIL;TYPE=PREF,INTERNET:{email}",
        f"URL;TYPE=LinkedIn:{linkedin}",
    ]
    if title:
        vcard_lines.append(f"TITLE:{title}")
    if company:
        vcard_lines.append(f"ORG:{company}")
    vcard_lines.append("END:VCARD")
    vcard = "\n".join(vcard_lines)

    # ── Color palette ──
    BG_COLOR = (13, 17, 23)          # GitHub dark
    QR_COLOR_START = (0, 255, 163)   # Neon green/cyan
    QR_COLOR_END = (0, 180, 255)     # Electric blue
    GLOW_COLOR = (0, 255, 200, 40)   # Subtle glow
    ACCENT = (0, 255, 163)           # Neon accent
    TEXT_COLOR = (200, 210, 220)     # Soft white
    TEXT_MUTED = (100, 120, 140)     # Muted

    # ── Generate base QR data ──
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # High so we can overlay logo
        box_size=1,
        border=0,
    )
    qr.add_data(vcard)
    qr.make(fit=True)
    matrix = qr.get_matrix()
    rows = len(matrix)
    cols = len(matrix[0]) if matrix else 0

    # ── Dimensions ──
    module_px = 14          # Pixels per module
    corner_radius = 4       # Rounded corner radius for modules
    padding = 60            # Padding around QR
    footer_height = 100     # Space for contact info strip

    qr_width = cols * module_px
    qr_height = rows * module_px
    canvas_width = qr_width + padding * 2
    canvas_height = qr_height + padding * 2 + footer_height

    # ── Create canvas ──
    img = Image.new("RGBA", (canvas_width, canvas_height), BG_COLOR + (255,))
    draw = ImageDraw.Draw(img)

    # ── Draw subtle grid pattern in background ──
    for x in range(0, canvas_width, 30):
        draw.line([(x, 0), (x, canvas_height)], fill=(30, 40, 50, 60), width=1)
    for y in range(0, canvas_height, 30):
        draw.line([(0, y), (canvas_width, y)], fill=(30, 40, 50, 60), width=1)

    # ── Helper: interpolate color based on position ──
    def get_module_color(row, col):
        """Gradient from top-left (green) to bottom-right (blue)."""
        t = (row / max(rows - 1, 1) + col / max(cols - 1, 1)) / 2
        r = int(QR_COLOR_START[0] + (QR_COLOR_END[0] - QR_COLOR_START[0]) * t)
        g = int(QR_COLOR_START[1] + (QR_COLOR_END[1] - QR_COLOR_START[1]) * t)
        b = int(QR_COLOR_START[2] + (QR_COLOR_END[2] - QR_COLOR_START[2]) * t)
        return (r, g, b, 255)

    # ── Helper: check if position is in a finder pattern ──
    def is_finder(row, col):
        """Returns True if this module is part of one of the 3 corner finder patterns."""
        size = 7
        # Top-left
        if row < size and col < size:
            return True
        # Top-right
        if row < size and col >= cols - size:
            return True
        # Bottom-left
        if row >= rows - size and col < size:
            return True
        return False

    # ── Draw rounded rectangle helper ──
    def draw_rounded_rect(x, y, w, h, radius, color):
        """Draw a filled rounded rectangle."""
        draw.rounded_rectangle([x, y, x + w, y + h], radius=radius, fill=color)

    # ── Draw QR modules with rounded corners and gradient ──
    qr_offset_x = padding
    qr_offset_y = padding

    for row_idx, row_data in enumerate(matrix):
        for col_idx, cell in enumerate(row_data):
            if not cell:
                continue

            x = qr_offset_x + col_idx * module_px
            y = qr_offset_y + row_idx * module_px
            color = get_module_color(row_idx, col_idx)

            if is_finder(row_idx, col_idx):
                # Finder patterns: solid squares with accent color
                draw_rounded_rect(x + 1, y + 1, module_px - 2, module_px - 2, 2, ACCENT + (255,))
            else:
                # Regular modules: rounded with gradient
                draw_rounded_rect(x + 1, y + 1, module_px - 2, module_px - 2, corner_radius, color)

    # ── Glow effect layer ──
    glow_layer = Image.new("RGBA", (canvas_width, canvas_height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)

    # Draw glow behind the QR
    glow_margin = 20
    glow_draw.rounded_rectangle(
        [qr_offset_x - glow_margin, qr_offset_y - glow_margin,
         qr_offset_x + qr_width + glow_margin, qr_offset_y + qr_height + glow_margin],
        radius=20,
        fill=(0, 200, 180, 15)
    )
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=15))
    img = Image.alpha_composite(img, glow_layer)
    draw = ImageDraw.Draw(img)

    # ── Center initials overlay ──
    initials = (first_name[0] + last_name[0]).upper() if first_name and last_name else "?"
    center_x = qr_offset_x + qr_width // 2
    center_y = qr_offset_y + qr_height // 2
    circle_r = int(module_px * 3.5)

    # Dark circle background
    draw.ellipse(
        [center_x - circle_r, center_y - circle_r,
         center_x + circle_r, center_y + circle_r],
        fill=BG_COLOR + (240,),
        outline=ACCENT + (200,),
        width=3
    )

    # Draw initials
    try:
        font_initials = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", circle_r)
    except (OSError, IOError):
        try:
            font_initials = ImageFont.truetype("arial.ttf", circle_r)
        except (OSError, IOError):
            font_initials = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), initials, font=font_initials)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(
        (center_x - tw // 2, center_y - th // 2 - 4),
        initials,
        fill=ACCENT + (255,),
        font=font_initials
    )

    # ── Footer contact strip ──
    footer_y = qr_offset_y + qr_height + 30

    # Separator line
    draw.line(
        [(padding, footer_y - 10), (canvas_width - padding, footer_y - 10)],
        fill=ACCENT + (80,),
        width=1
    )

    try:
        font_name = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
        font_detail = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
    except (OSError, IOError):
        try:
            font_name = ImageFont.truetype("arial.ttf", 20)
            font_detail = ImageFont.truetype("arial.ttf", 14)
            font_small = ImageFont.truetype("arial.ttf", 12)
        except (OSError, IOError):
            font_name = ImageFont.load_default()
            font_detail = font_name
            font_small = font_name

    full_name = f"{first_name} {last_name}"
    if title and company:
        subtitle = f"{title} @ {company}"
    elif title:
        subtitle = title
    elif company:
        subtitle = company
    else:
        subtitle = ""

    draw.text((padding, footer_y), full_name, fill=TEXT_COLOR + (255,), font=font_name)
    if subtitle:
        draw.text((padding, footer_y + 26), subtitle, fill=TEXT_MUTED + (255,), font=font_detail)

    # Contact details on the right side
    right_x = canvas_width - padding
    detail_lines = [email, mobile]
    for i, line in enumerate(detail_lines):
        bbox = draw.textbbox((0, 0), line, font=font_small)
        tw = bbox[2] - bbox[0]
        draw.text((right_x - tw, footer_y + i * 18), line, fill=TEXT_MUTED + (255,), font=font_small)

    # ── Corner decorations (techie bracket style) ──
    bracket_len = 25
    bracket_color = ACCENT + (120,)
    bracket_w = 2

    # Top-left bracket
    draw.line([(8, 8), (8, 8 + bracket_len)], fill=bracket_color, width=bracket_w)
    draw.line([(8, 8), (8 + bracket_len, 8)], fill=bracket_color, width=bracket_w)
    # Top-right bracket
    draw.line([(canvas_width - 8, 8), (canvas_width - 8, 8 + bracket_len)], fill=bracket_color, width=bracket_w)
    draw.line([(canvas_width - 8, 8), (canvas_width - 8 - bracket_len, 8)], fill=bracket_color, width=bracket_w)
    # Bottom-left bracket
    draw.line([(8, canvas_height - 8), (8, canvas_height - 8 - bracket_len)], fill=bracket_color, width=bracket_w)
    draw.line([(8, canvas_height - 8), (8 + bracket_len, canvas_height - 8)], fill=bracket_color, width=bracket_w)
    # Bottom-right bracket
    draw.line([(canvas_width - 8, canvas_height - 8), (canvas_width - 8, canvas_height - 8 - bracket_len)], fill=bracket_color, width=bracket_w)
    draw.line([(canvas_width - 8, canvas_height - 8), (canvas_width - 8 - bracket_len, canvas_height - 8)], fill=bracket_color, width=bracket_w)

    # ── Save ──
    output_filename = f"{first_name.lower()}_{last_name.lower()}_qr.png"
    final_img = img.convert("RGB")
    final_img.save(output_filename, quality=95)

    print(f"\n  ✓ Saved: {output_filename}")
    print(f"  ✓ Size: {canvas_width}x{canvas_height}px")
    print(f"  ✓ QR version: {qr.version} ({rows}x{cols} modules)")
    print(f"  ✓ Error correction: HIGH (logo-safe)\n")


if __name__ == "__main__":
    create_tech_contact_qr()
