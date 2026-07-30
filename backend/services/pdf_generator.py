# services/pdf_generator.py
import os
import uuid
from datetime import datetime
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER
from utils.watermark import add_watermark  # Changed from relative to absolute import

async def generate_insurance_pdf(accident_data: dict, report_data: dict) -> str:
    """
    Generate a professional insurance PDF report.
    Returns the file path of the generated PDF.
    """
    # Create a temporary file
    report_id = report_data.get("report_id", str(uuid.uuid4()))
    filename = f"insurance_report_{report_id}.pdf"
    filepath = f"/tmp/{filename}"

    # Build document
    doc = SimpleDocTemplate(filepath, pagesize=A4,
                            rightMargin=1.5*cm, leftMargin=1.5*cm,
                            topMargin=1.5*cm, bottomMargin=1.5*cm)
    styles = getSampleStyleSheet()
    story = []

    # HEADER
    title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=22, alignment=TA_CENTER, spaceAfter=12)
    story.append(Paragraph("INSURANCE ACCIDENT REPORT", title_style))
    story.append(Paragraph(f"Report ID: {report_id}", styles['Normal']))
    story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}", styles['Normal']))
    story.append(Spacer(1, 0.5*cm))

    # INCIDENT DETAILS
    story.append(Paragraph("INCIDENT DETAILS", styles['Heading2']))
    data = [
        ["Case Number", report_data.get("case_number", "N/A")],
        ["Vehicle Number", report_data.get("vehicle_number", "N/A")],
        ["Vehicle Type", report_data.get("vehicle_type", "N/A")],
        ["Owner", report_data.get("owner_name", "N/A")],
        ["Driver", report_data.get("driver_name", "N/A")],
        ["Date", report_data.get("date", "N/A")],
        ["Time", report_data.get("time", "N/A")],
        ["Location", report_data.get("full_address", "N/A")],
        ["GPS", f"{report_data.get('gps_coordinates', {}).get('latitude')}, {report_data.get('gps_coordinates', {}).get('longitude')}"],
    ]
    t = Table(data, colWidths=[4*cm, 10*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.lightgrey),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.5*cm))

    # SENSOR DATA
    story.append(Paragraph("SENSOR DATA", styles['Heading2']))
    sensor_data = [
        ["Speed", f"{accident_data.get('speed_kmph', 0)} km/h"],
        ["Max G‑Force", f"{accident_data.get('acceleration_g', 0)} g"],
        ["Max Tilt", f"{accident_data.get('tilt_degree', 0)}°"],
        ["Human Presence", "Yes" if accident_data.get('human_presence') else "No"],
        ["Breathing Detected", "Yes" if accident_data.get('breathing_detected') else "No"],
        ["Fire Detected", "Yes" if accident_data.get('fire_detected') else "No"],
        ["AI Confidence", f"{accident_data.get('ai_confidence', 0)*100:.0f}%"],
        ["Accident Severity", report_data.get('accident_severity', 'unknown').upper()],
    ]
    t2 = Table(sensor_data, colWidths=[4*cm, 8*cm])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.lightgrey),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
    ]))
    story.append(t2)
    story.append(Spacer(1, 0.5*cm))

    # AI SUMMARY
    story.append(Paragraph("AI GENERATED SUMMARY", styles['Heading2']))
    summary = report_data.get("ai_summary", "Summary not available.")
    story.append(Paragraph(summary, styles['Normal']))
    story.append(Spacer(1, 0.5*cm))

    # TIMELINE
    story.append(Paragraph("INCIDENT TIMELINE", styles['Heading2']))
    timeline = report_data.get("timeline", [])
    for event in timeline:
        timestamp = event.get('timestamp', '')
        desc = event.get('event', '')
        detail = event.get('description', '')
        story.append(Paragraph(f"<b>{timestamp}</b> – {desc} <i>({detail})</i>", styles['Normal']))
    story.append(Spacer(1, 0.5*cm))

    # CHECKLIST
    story.append(Paragraph("INSURANCE CLAIM READINESS CHECKLIST", styles['Heading2']))
    checklist = report_data.get("checklist", {})
    items = checklist.get("items", [])
    for item in items:
        status = "✔" if item["status"] else "✘"
        story.append(Paragraph(f"{status} {item['item']}", styles['Normal']))
    completion = checklist.get("percentage", 0)
    story.append(Paragraph(f"<b>Completion: {completion}%</b>", styles['Normal']))
    story.append(Spacer(1, 0.5*cm))

    # FOOTER
    story.append(Paragraph("This report is confidential and generated automatically.", styles['Italic']))
    story.append(Paragraph(f"Report Version {report_data.get('report_version', '1.0')}", styles['Italic']))

    # Build PDF
    doc.build(story)

    # Add watermark
    temp_watermarked = filepath.replace('.pdf', '_watermarked.pdf')
    add_watermark(filepath, temp_watermarked)
    os.replace(temp_watermarked, filepath)  # Replace original with watermarked

    return filepath