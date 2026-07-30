# utils/watermark.py
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from PyPDF2 import PdfReader, PdfWriter

def add_watermark(input_pdf: str, output_pdf: str):
    """
    Add a diagonal "CONFIDENTIAL" watermark to each page of a PDF.
    """
    reader = PdfReader(input_pdf)
    writer = PdfWriter()

    for page in reader.pages:
        packet = BytesIO()
        c = canvas.Canvas(packet, pagesize=A4)
        c.setFont("Helvetica-Bold", 50)
        c.setFillColorRGB(0.8, 0.8, 0.8, 0.3)
        c.saveState()
        c.translate(A4[0]/2, A4[1]/2)
        c.rotate(45)
        c.drawCentredString(0, 0, "CONFIDENTIAL")
        c.restoreState()
        c.save()
        packet.seek(0)
        watermark = PdfReader(packet)

        page.merge_page(watermark.pages[0])
        writer.add_page(page)

    with open(output_pdf, "wb") as f:
        writer.write(f)