# backend/geocoding.py
import aiohttp
import asyncio
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime, timedelta

router = APIRouter(prefix="/geocode", tags=["geocoding"])

# Nominatim configuration
NOMINATIM_URL = "https://nominatim.openstreetmap.org"
USER_AGENT = "AlertSystem/1.0 (contact: saptakchaki.official@gmail.com)"

# Rate limiting with lock
_last_request_time = 0
_request_lock = asyncio.Lock()

# Simple cache for reverse geocode results (expires after 1 hour)
_cache = {}
_CACHE_TTL = timedelta(hours=1)

async def rate_limited_request(url: str, params: dict) -> dict:
    """Serialize requests and enforce at least 1 second between them."""
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
    """Get address details from coordinates using Nominatim, with caching."""
    # Check cache first
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
    # Store in cache
    _cache[cache_key] = (result, datetime.utcnow())
    return result

# The rest of the file (nearby, nearby-multi) remains unchanged
@router.get("/nearby")
async def nearby_places(lat: float, lon: float, type: str = "hospital", radius: int = 2000) -> List[Dict[str, Any]]:
    """Find nearby amenities of a single type using Overpass API."""
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
            "distance": ((lat_elem - lat)**2 + (lon_elem - lon)**2)**0.5 * 111000
        })
    results.sort(key=lambda x: x["distance"])
    return results

@router.get("/nearby-multi")
async def nearby_places_multi(
    lat: float,
    lon: float,
    types: str = "hospital,police,fire_station",
    radius: int = 2000
) -> Dict[str, List[Dict[str, Any]]]:
    """Find nearby amenities of multiple types in one Overpass query."""
    amenity_list = [t.strip() for t in types.split(",")]
    regex = "|".join(amenity_list)
    overpass_url = "https://overpass-api.de/api/interpreter"
    query = f"""
    [out:json];
    (
      node["amenity"~"{regex}"](around:{radius},{lat},{lon});
      way["amenity"~"{regex}"](around:{radius},{lat},{lon});
      relation["amenity"~"{regex}"](around:{radius},{lat},{lon});
    );
    out center;
    """
    async with aiohttp.ClientSession() as session:
        async with session.get(overpass_url, params={"data": query}) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=resp.status, detail="Overpass API error")
            data = await resp.json()

    results = {t: [] for t in amenity_list}
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
        amenity_type = element.get("tags", {}).get("amenity")
        if amenity_type in results:
            results[amenity_type].append({
                "name": name,
                "lat": lat_elem,
                "lon": lon_elem,
                "distance": ((lat_elem - lat)**2 + (lon_elem - lon)**2)**0.5 * 111000
            })

    for t in results:
        results[t].sort(key=lambda x: x["distance"])

    return results