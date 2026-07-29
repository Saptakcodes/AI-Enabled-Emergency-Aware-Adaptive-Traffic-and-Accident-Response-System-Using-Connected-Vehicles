# routers/insurance.py
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import FileResponse
from database import accident_collection, insurance_reports_collection
from models import InsuranceReport
from datetime import datetime, timedelta
import uuid
import asyncio
import os
from bson import ObjectId
from services.summary_generator import generate_accident_summary
from services.timeline_builder import build_timeline
from services.checklist_builder import build_checklist
from services.pdf_generator import generate_insurance_pdf
from services.qr_generator import generate_qr_code
from auth import get_current_user, require_roles

router = APIRouter(prefix="/insurance", tags=["insurance"])

async def generate_report_background(accident_id: str, user_email: str):
    """
    Background task to generate and store the insurance report.
    """
    try:
        accident = await accident_collection.find_one({"_id": ObjectId(accident_id)})
        if not accident:
            return

        report_id = f"INS-{uuid.uuid4().hex[:8].upper()}"
        case_number = f"CASE-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"

        timeline = build_timeline(accident)
        checklist = build_checklist(accident, report_generated=True)
        summary = generate_accident_summary(accident)

        g = accident.get("acceleration_g", 0)
        tilt = accident.get("tilt_degree", 0)
        if g > 5 or tilt > 40:
            severity = "critical"
        elif g > 3 or tilt > 20:
            severity = "severe"
        elif g > 2 or tilt > 10:
            severity = "moderate"
        else:
            severity = "minor"

        qr_data = f"https://yourdomain.com/report/{report_id}"

        report_data = {
            "report_id": report_id,
            "accident_id": accident_id,
            "case_number": case_number,
            "vehicle_number": accident.get("vehicle_number", "N/A"),
            "vehicle_type": accident.get("vehicle_type", "N/A"),
            "owner_name": accident.get("owner_name", "N/A"),
            "driver_name": accident.get("driver_name", "N/A"),
            "emergency_contact": accident.get("emergency_contact", "N/A"),
            "insurance_policy_number": accident.get("insurance_policy_number", None),
            "date": accident.get("timestamp").strftime("%Y-%m-%d"),
            "time": accident.get("timestamp").strftime("%H:%M:%S"),
            "gps_coordinates": {"latitude": accident.get("latitude"), "longitude": accident.get("longitude")},
            "full_address": accident.get("full_address", "Address not available"),
            "nearest_landmark": accident.get("nearest_landmark", None),
            "nearest_hospital": accident.get("nearest_hospital", None),
            "nearest_police_station": accident.get("nearest_police_station", None),
            "weather": "Clear",
            "road_type": accident.get("road_type", None),
            "impact_direction": accident.get("impact_direction", None),
            "collision_type": accident.get("collision_type", None),
            "vehicle_speed": accident.get("speed_kmph", 0),
            "max_g_force": accident.get("acceleration_g", 0),
            "max_tilt": accident.get("tilt_degree", 0),
            "human_presence": accident.get("human_presence", False),
            "breathing_status": accident.get("breathing_detected", False),
            "fire_detected": accident.get("fire_detected", False),
            "ai_confidence": accident.get("ai_confidence", 0.0),
            "accident_severity": severity,
            "emergency_actions_taken": accident.get("emergency_actions_taken", []),
            "traffic_signal_actions": accident.get("traffic_signal_actions", []),
            "green_corridor_activated": accident.get("green_corridor_activated", False),
            "manual_override_used": accident.get("manual_override_used", False),
            "timeline": timeline,
            "nearby_responders": [],
            "ai_summary": summary,
            "checklist": checklist,
            "digital_signature": None,
            "generated_at": datetime.utcnow(),
            "report_version": "1.0",
            "qr_code_data": qr_data
        }

        pdf_path = await generate_insurance_pdf(accident, report_data)
        report_data["pdf_url"] = pdf_path

        qr_img = generate_qr_code(qr_data)
        report_data["qr_code_image"] = qr_img

        await insurance_reports_collection.insert_one(report_data)

        await accident_collection.update_one(
            {"_id": ObjectId(accident_id)},
            {"$set": {"insurance_report_id": report_id}}
        )

    except Exception as e:
        print(f"Error generating insurance report: {e}")

@router.post("/generate/{accident_id}")
async def generate_insurance_report(
    accident_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    try:
        accident = await accident_collection.find_one({"_id": ObjectId(accident_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid accident ID")
    if not accident:
        raise HTTPException(status_code=404, detail="Accident not found")

    existing = await insurance_reports_collection.find_one({"accident_id": accident_id})
    if existing:
        return {"report_id": existing["report_id"], "message": "Report already exists"}

    background_tasks.add_task(generate_report_background, accident_id, current_user.get("email"))
    return {"message": "Report generation started", "accident_id": accident_id}

# =========================
# GET REPORT (JSON or PDF download)
# =========================
@router.get("/report/{report_id}")
async def get_insurance_report(
    report_id: str,
    download: bool = False,
    current_user: dict = Depends(get_current_user)
):
    report = await insurance_reports_collection.find_one({"report_id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if download:
        pdf_path = report.get("pdf_url")
        # If PDF missing, try to regenerate it on the fly
        if not pdf_path or not os.path.exists(pdf_path):
            print(f"📄 PDF missing for report {report_id}, regenerating...")
            # Get the accident data
            accident = await accident_collection.find_one({"_id": ObjectId(report["accident_id"])})
            if not accident:
                raise HTTPException(status_code=404, detail="Accident data not found")
            # Regenerate PDF
            new_pdf_path = await generate_insurance_pdf(accident, report)
            # Update database with new path
            await insurance_reports_collection.update_one(
                {"report_id": report_id},
                {"$set": {"pdf_url": new_pdf_path}}
            )
            pdf_path = new_pdf_path
        
        if not os.path.exists(pdf_path):
            raise HTTPException(status_code=404, detail="PDF not found")
        return FileResponse(pdf_path, media_type="application/pdf", filename=f"insurance_report_{report_id}.pdf")
    
    report["_id"] = str(report["_id"])
    return report

# =========================
# DOWNLOAD ENDPOINT - NO AUTHENTICATION (FOR DEMO)
# =========================
@router.get("/report/{report_id}/download")
async def download_insurance_pdf(
    report_id: str,
):
    """
    Download the PDF version of the insurance report.
    (Temporarily no authentication for demo purposes)
    """
    report = await insurance_reports_collection.find_one({"report_id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    pdf_path = report.get("pdf_url")
    # If PDF missing, regenerate it on the fly
    if not pdf_path or not os.path.exists(pdf_path):
        print(f"📄 PDF missing for report {report_id}, regenerating...")
        accident = await accident_collection.find_one({"_id": ObjectId(report["accident_id"])})
        if not accident:
            raise HTTPException(status_code=404, detail="Accident data not found")
        new_pdf_path = await generate_insurance_pdf(accident, report)
        await insurance_reports_collection.update_one(
            {"report_id": report_id},
            {"$set": {"pdf_url": new_pdf_path}}
        )
        pdf_path = new_pdf_path
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"insurance_report_{report_id}.pdf")

@router.get("/checklist/{accident_id}")
async def get_checklist(
    accident_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        accident = await accident_collection.find_one({"_id": ObjectId(accident_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid accident ID")
    if not accident:
        raise HTTPException(status_code=404, detail="Accident not found")

    report = await insurance_reports_collection.find_one({"accident_id": accident_id})
    checklist = build_checklist(accident, report_generated=bool(report))
    return checklist

@router.get("/summary/{accident_id}")
async def get_summary(
    accident_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        accident = await accident_collection.find_one({"_id": ObjectId(accident_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid accident ID")
    if not accident:
        raise HTTPException(status_code=404, detail="Accident not found")

    summary = generate_accident_summary(accident)
    return {"summary": summary}

@router.get("/timeline/{accident_id}")
async def get_timeline(
    accident_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        accident = await accident_collection.find_one({"_id": ObjectId(accident_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid accident ID")
    if not accident:
        raise HTTPException(status_code=404, detail="Accident not found")

    timeline = build_timeline(accident)
    return {"timeline": timeline}