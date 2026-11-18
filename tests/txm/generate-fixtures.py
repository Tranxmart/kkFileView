#!/usr/bin/env python3
# Copyright 2026 Tranxmart, Inc. All rights reserved.
"""Small, owned fixtures: no external documents or production data."""
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn
from openpyxl import Workbook
from pptx import Presentation
from pptx.util import Pt

fixtures = Path("/tmp/fixtures")
fixtures.mkdir(parents=True, exist_ok=True)
marker = "TXM packaging"
chinese = "中文文档预览"

doc = Document()
style = doc.styles["Normal"]
style.font.name = "Noto Sans CJK SC"
style.element.rPr.rFonts.set(qn("w:eastAsia"), "Noto Sans CJK SC")
doc.add_paragraph(marker)
doc.add_paragraph(chinese)
doc.save(fixtures / "txm.docx")

book = Workbook()
sheet = book.active
sheet.title = "TXM"
sheet["A1"] = marker
sheet["B1"] = chinese
sheet["A2"] = 42
book.save(fixtures / "txm.xlsx")

slides = Presentation()
slide = slides.slides.add_slide(slides.slide_layouts[6])
box = slide.shapes.add_textbox(914400, 914400, 7315200, 2743200)
box.text_frame.text = marker + "\n" + chinese
for paragraph in box.text_frame.paragraphs:
    for run in paragraph.runs:
        run.font.name = "Noto Sans CJK SC"
        run.font.size = Pt(24)
slides.save(fixtures / "txm.pptx")

# One-page PDF with an explicit cross-reference table, using a standard font.
stream = b"BT /F1 20 Tf 72 720 Td (TXM PDF fixture) Tj ET"
objects = [
    b"<< /Type /Catalog /Pages 2 0 R >>",
    b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
    b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
]
pdf = bytearray(b"%PDF-1.4\n")
offsets = [0]
for number, body in enumerate(objects, 1):
    offsets.append(len(pdf))
    pdf.extend(str(number).encode() + b" 0 obj\n" + body + b"\nendobj\n")
xref = len(pdf)
pdf.extend(b"xref\n0 6\n0000000000 65535 f \n")
for offset in offsets[1:]:
    pdf.extend(f"{offset:010d} 00000 n \n".encode())
pdf.extend(f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
(fixtures / "txm.pdf").write_bytes(pdf)
