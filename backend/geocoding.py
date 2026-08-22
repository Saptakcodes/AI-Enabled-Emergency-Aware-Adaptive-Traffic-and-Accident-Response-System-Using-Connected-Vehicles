# backend/geocoding.py
import os
import aiohttp
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime, timedelta
import asyncio
from math import radians, sin, cos, sqrt, atan2

router = APIRouter(prefix="/geocode", tags=["geocoding"])

# ============= NOMINATIM (Reverse Geocode) =============
NOMINATIM_URL = "https://nominatim.openstreetmap.org"
USER_AGENT = "AlertSystem/1.0 (contact: your-email@example.com)"
_last_request_time = 0
_request_lock = asyncio.Lock()
_cache = {}
_CACHE_TTL = timedelta(hours=1)

async def rate_limited_request(url: str, params: dict) -> dict:
    global _last_request_time
    async with _request_lock:
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
    cache_key = f"{lat},{lon}"
    if cache_key in _cache:
        cached_result, cached_time = _cache[cache_key]
        if datetime.utcnow() - cached_time < _CACHE_TTL:
            return cached_result

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
    _cache[cache_key] = (result, datetime.utcnow())
    return result

# ============= GOOGLE PLACES (Nearby Multi) =============
# ✅ Changed variable name to match your .env
VITE_GOOGLE_MAPS_API_KEY = os.getenv("VITE_GOOGLE_MAPS_API_KEY")

@router.get("/nearby-multi")
async def nearby_places_multi_google(
    lat: float,
    lon: float,
    types: str = "hospital,police,fire_station",
    radius: int = 5000
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Find nearby places using Google Places API.
    """
    if not VITE_GOOGLE_MAPS_API_KEY:
        raise HTTPException(status_code=500, detail="Google API key not configured")

    type_list = [t.strip() for t in types.split(",")]
    results = {t: [] for t in type_list}

    async with aiohttp.ClientSession() as session:
        for place_type in type_list:
            url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
            params = {
                "location": f"{lat},{lon}",
                "radius": radius,
                "type": place_type,
                "key": VITE_GOOGLE_MAPS_API_KEY,
            }
            try:
                async with session.get(url, params=params, timeout=10) as resp:
                    if resp.status != 200:
                        continue
                    data = await resp.json()
                    if data.get("status") == "OK":
                        for p in data.get("results", []):
                            p_lat = p["geometry"]["location"]["lat"]
                            p_lon = p["geometry"]["location"]["lng"]
                            # Haversine distance in meters
                            R = 6371000
                            dlat = radians(p_lat - lat)
                            dlon = radians(p_lon - lon)
                            a = sin(dlat/2)**2 + cos(radians(lat)) * cos(radians(p_lat)) * sin(dlon/2)**2
                            c = 2 * atan2(sqrt(a), sqrt(1-a))
                            distance = R * c

                            results[place_type].append({
                                "name": p.get("name", "Unnamed"),
                                "lat": p_lat,
                                "lon": p_lon,
                                "distance": distance,
                                "vicinity": p.get("vicinity", "")
                            })
                    else:
                        print(f"Google Places API error for {place_type}: {data.get('status')}")
            except Exception as e:
                print(f"Google Places request failed for {place_type}: {e}")
                results[place_type] = []

    for t in results:
        results[t].sort(key=lambda x: x["distance"])
    return results