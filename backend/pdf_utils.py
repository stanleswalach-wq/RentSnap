"""Shared PDF helpers for LOKUM.PDF document generators."""
import os
import io
import base64
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image

# Automatyczne dopasowanie ścieżki do systemu operacyjnego (Windows vs Linux)
if os.name == "nt":
    # Ścieżka dla Windowsa
    FONT_DIR = "C:/Windows/Fonts"
    pdfmetrics.registerFont(TTFont("Sans", f"{FONT_DIR}/arial.ttf"))
    pdfmetrics.registerFont(TTFont("Sans-Bold", f"{FONT_DIR}/arialbd.ttf"))
else:
    # Ścieżka dla Linuksa (np. gdyby projekt szedł na serwer)
    FONT_DIR = "/usr/share/fonts/truetype/liberation"
    pdfmetrics.registerFont(TTFont("Sans", f"{FONT_DIR}/LiberationSans-Regular.ttf"))
    pdfmetrics.registerFont(TTFont("Sans-Bold", f"{FONT_DIR}/LiberationSans-Bold.ttf"))

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm
BOTTOM_MARGIN = 40 * mm
CONTENT_W = PAGE_W - 2 * MARGIN

INK = (0.102, 0.098, 0.090)      # #1a1917
ACCENT = (0.710, 0.220, 0.122)    # #b5381f
GREY = (0.45, 0.44, 0.42)


def _split_long_word(word, font, size, width):
    parts, cur = [], ""
    for ch in word:
        if pdfmetrics.stringWidth(cur + ch, font, size) <= width:
            cur += ch
        else:
            parts.append(cur)
            cur = ch
    if cur:
        parts.append(cur)
    return parts


def wrap_text(text, font, size, width):
    lines = []
    for raw in (text or "").split("\n"):
        if not raw.strip():
            lines.append("")
            continue
        line = ""
        for word in raw.split(" "):
            candidate = f"{line} {word}".strip()
            if pdfmetrics.stringWidth(candidate, font, size) <= width:
                line = candidate
            else:
                if line:
                    lines.append(line)
                if pdfmetrics.stringWidth(word, font, size) <= width:
                    line = word
                else:
                    chunks = _split_long_word(word, font, size, width)
                    lines.extend(chunks[:-1])
                    line = chunks[-1]
        if line:
            lines.append(line)
    return lines or [""]


class PDFDoc:
    """Small page-flow wrapper around reportlab canvas with Polish fonts."""

    def __init__(self, title):
        self.buf = io.BytesIO()
        self.c = canvas.Canvas(self.buf, pagesize=A4)
        self.c.setTitle(title)
        self.title = title
        self.y = PAGE_H - MARGIN
        self._header()

    def _header(self):
        c = self.c
        c.setFillColorRGB(*INK)
        c.setFont("Sans-Bold", 13)
        c.drawString(MARGIN, PAGE_H - MARGIN + 2 * mm, "LOKUM.PDF")
        c.setFillColorRGB(*GREY)
        c.setFont("Sans", 8)
        c.drawRightString(PAGE_W - MARGIN, PAGE_H - MARGIN + 2 * mm, self.title)
        c.setStrokeColorRGB(*INK)
        c.setLineWidth(0.6)
        c.line(MARGIN, self.y, PAGE_W - MARGIN, self.y)
        self.y -= 10 * mm

    def _footer(self):
        c = self.c
        c.setFillColorRGB(*GREY)
        c.setFont("Sans", 7)
        c.drawCentredString(
            PAGE_W / 2, 10 * mm,
            "Dokument wygenerowany w aplikacji LOKUM.PDF - proste generowanie umow i protokolow najmu.",
        )

    def ensure_space(self, needed):
        if self.y - needed < 40 * mm:
            self._footer()
            self.c.showPage()
            self.y = PAGE_H - MARGIN

    def heading(self, text):
        self.ensure_space(14 * mm)
        self.c.setFillColorRGB(*INK)
        self.c.setFont("Sans-Bold", 15)
        self.c.drawString(MARGIN, self.y, text)
        self.y -= 8 * mm

    def section(self, text):
        self.ensure_space(10 * mm)
        self.c.setFillColorRGB(*INK)
        self.c.setFont("Sans-Bold", 11)
        self.c.drawString(MARGIN, self.y, text)
        self.y -= 6 * mm

    def paragraph(self, text, size=10, bold=False, indent=0):
        font = "Sans-Bold" if bold else "Sans"
        line_h = size * 1.45
        lines = wrap_text(text, font, size, CONTENT_W - indent)
        self.ensure_space(len(lines) * line_h + 2 * mm)
        self.c.setFillColorRGB(*INK)
        self.c.setFont(font, size)
        for line in lines:
            self.c.drawString(MARGIN + indent, self.y, line)
            self.y -= line_h
        self.y -= 2 * mm

    def bullet(self, text, size=10):
        self.paragraph("\u2022  " + text, size=size, indent=4 * mm)

    def spacer(self, h=4 * mm):
        self.y -= h

    def signature_block(self, left_label, right_label, left_b64=None, right_b64=None):
        self.ensure_space(34 * mm)
        col_w = CONTENT_W / 2 - 8 * mm
        line_y = self.y - 16 * mm
        c = self.c
        for x0, label, b64 in (
            (MARGIN, left_label, left_b64),
            (MARGIN + CONTENT_W / 2 + 8 * mm, right_label, right_b64),
        ):
            img_h = 0
            if b64:
                try:
                    raw = base64.b64decode(b64.split(",")[-1])
                    img = Image.open(io.BytesIO(raw)).convert("RGBA")
                    bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
                    img = Image.alpha_composite(bg, img).convert("RGB")
                    scale = min(1.0, col_w / (img.width * 0.28))
                    w = img.width * 0.28 * scale
                    img_h = img.height * 0.28 * scale
                    img_h = min(img_h, 14 * mm)
                    c.drawImage(ImageReader(img), x0, self.y - img_h, width=w, height=img_h)
                except Exception:
                    img_h = 0
            c.setStrokeColorRGB(*INK)
            c.setLineWidth(0.5)
            c.line(x0, line_y, x0 + col_w, line_y)
            c.setFillColorRGB(*GREY)
            c.setFont("Sans", 8)
            c.drawString(x0, line_y - 4 * mm, label)
        self.y = line_y - 10 * mm
     
    def photo_grid(self, photos_b64, cols=3, cell=52 * mm):
        images = []
        for b64 in photos_b64 or []:
            try:
                if not b64 or not isinstance(b64, str):
                    continue
                if "," in b64:
                    b64 = b64.split(",")[1]
                raw = base64.b64decode(b64)
                img = Image.open(io.BytesIO(raw)).convert("RGB")
                img.thumbnail((600, 600))
                images.append(img)
            except Exception as e:
                print("Błąd dekodowania zdjęcia:", e)
                continue
                
        if not images:
            return

        rows_count = (len(images) + cols - 1) // cols
        row_h = cell + 10 * mm
        total_grid_height = rows_count * row_h + 30 * mm

        self.ensure_space(total_grid_height)

        self.section(f"DOKUMENTACJA FOTOGRAFICZNA ({len(images)} zdj.)")
        
        current_row_y = self.y
        max_h_in_row = 0

        for i, img in enumerate(images):
            col = i % cols
            
            if col == 0 and i > 0:
                current_row_y -= (max_h_in_row + 5 * mm)
                if current_row_y - cell < 70:
                    self.show_page()
                    current_row_y = self.y
                max_h_in_row = 0

            ratio = img.height / img.width
            h = cell * ratio
            h = min(h, cell * 1.3)
            
            if h > max_h_in_row:
                max_h_in_row = h
            
            try:
                self.c.drawImage(
                    ImageReader(img),
                    MARGIN + col * (cell + 3 * mm),
                    current_row_y - h,
                    width=cell,
                    height=h,
                    preserveAspectRatio=True,
                    mask='auto'
                )
            except Exception as e:
                print("Błąd rysowania zdjęcia na kanwie:", e)
            
            if col == cols - 1 or i == len(images) - 1:
                self.y = current_row_y - max_h_in_row - 8 * mm

    def save(self):
        self._footer()
        self.c.save()
        self.buf.seek(0)
        return self.buf.read()
