# backend/geocoding.py
import aiohttp
import asyncio
from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/geocode", tags=["geocoding"])

# Nominatim configuration
NOMINATIM_URL = "https://nominatim.openstreetmap.org"
USER_AGENT = "AlertSystem/1.0 (contact: your-email@example.com)"  # Change to your email

# Rate limiting: 1 request per second
_last_request_time = 0

async def rate_limited_request(url: str, params: dict) -> dict:
    global _last_request_time
    now = asyncio.get_event_loop().time()
    time_since_last = now - _last_request_time
    if time_since_last < 1.0:
        await asyncio.sleep(1.0 - time_since_last)
    async with aiohttp.ClientSession() as session:
        async with session.get(url, params=params, headers={"User-Agent": USER_AGENT}) as resp:
            _last_request_time = asyncio.get_event_loop().time()
            if resp.status != 200:
                raise HTTPException(status_code=resp.status, detail="Geocoding service error")
            return await resp.json()

@router.get("/reverse")
async def reverse_geocode(lat: float, lon: float) -> Dict[str, Any]:
    """Get address details from coordinates using Nominatim."""
    params = {
        "lat": lat,
        "lon": lon,
        "format": "json",
        "addressdetails": 1,
        "zoom": 18,
    }
    data = await rate_limited_request(f"{NOMINATIM_URL}/reverse", params)
    if not data:
        raise HTTPException(status_code=404, detail="No address found")
    # Extract useful fields
    address = data.get("address", {})
    result = {
        "display_name": data.get("display_name", ""),
        "road": address.get("road"),
        "city": address.get("city") or address.get("town") or address.get("village"),
        "state": address.get("state"),
        "country": address.get("country"),
        "postcode": address.get("postcode"),
        "neighbourhood": address.get("neighbourhood"),
        "suburb": address.get("suburb"),
    }
    return result

@router.get("/nearby")
async def nearby_places(lat: float, lon: float, type: str = "hospital", radius: int = 2000) -> List[Dict[str, Any]]:
    """Find nearby amenities using Overpass API (OpenStreetMap)."""
    # Overpass query: find nodes/ways with amenity=type within radius
    overpass_url = "https://overpass-api.de/api/interpreter"
    query = f"""
    [out:json];
    (
      node["amenity"="{type}"](around:{radius},{lat},{lon});
      way["amenity"="{type}"](around:{radius},{lat},{lon});
      relation["amenity"="{type}"](around:{radius},{lat},{lon});
    );
    out center;
    """
    async with aiohttp.ClientSession() as session:
        async with session.get(overpass_url, params={"data": query}) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=resp.status, detail="Overpass API error")
            data = await resp.json()
    results = []
    for element in data.get("elements", []):
        if element["type"] == "node":
            name = element.get("tags", {}).get("name", "Unnamed")
            lat_elem = element["lat"]
            lon_elem = element["lon"]
        else:  # way or relation
            name = element.get("tags", {}).get("name", "Unnamed")
            if "center" in element:
                lat_elem = element["center"]["lat"]
                lon_elem = element["center"]["lon"]
            else:
                continue
        results.append({
            "name": name,
            "lat": lat_elem,
            "lon": lon_elem,
            "distance": ((lat_elem - lat)**2 + (lon_elem - lon)**2)**0.5 * 111000  # approximate meters
        })
    # Sort by distance
    results.sort(key=lambda x: x["distance"])
    return results