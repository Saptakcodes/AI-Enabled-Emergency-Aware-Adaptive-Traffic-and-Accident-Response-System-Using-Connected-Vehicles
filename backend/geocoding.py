# backend/geocoding.py
import os
import aiohttp
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2

router = APIRouter(prefix="/geocode", tags=["geocoding"])

# ============= GOOGLE GEOCODING (Reverse Geocode) =============
VITE_GOOGLE_MAPS_API_KEY = os.getenv("VITE_GOOGLE_MAPS_API_KEY")

# Simple cache for reverse geocode results (expires after 1 hour)
_cache = {}
_CACHE_TTL = timedelta(hours=1)

@router.get("/reverse")
async def reverse_geocode(lat: float, lon: float) -> Dict[str, Any]:
    """
    Get address details from coordinates using Google Geocoding API.
    Returns a 200 with address data or a "not found" placeholder.
    """
    if not VITE_GOOGLE_MAPS_API_KEY:
        raise HTTPException(status_code=500, detail="Google API key not configured")

    cache_key = f"{lat},{lon}"
    # Check cache
    if cache_key in _cache:
        cached_result, cached_time = _cache[cache_key]
        if datetime.utcnow() - cached_time < _CACHE_TTL:
            return cached_result

    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "latlng": f"{lat},{lon}",
        "key": VITE_GOOGLE_MAPS_API_KEY,
    }

    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, params=params, timeout=10) as resp:
                if resp.status != 200:
                    raise HTTPException(status_code=resp.status, detail="Geocoding service error")
                data = await resp.json()
                
                # Handle ZERO_RESULTS gracefully
                if data.get("status") == "ZERO_RESULTS":
                    result = {
                        "display_name": "No address found",
                        "road": None,
                        "city": None,
                        "state": None,
                        "country": None,
                        "postcode": None,
                        "neighbourhood": None,
                        "suburb": None,
                        "latitude": lat,
                        "longitude": lon,
                    }
                    _cache[cache_key] = (result, datetime.utcnow())
                    return result

                if data.get("status") != "OK":
                    raise HTTPException(status_code=404, detail=f"Geocoding API error: {data.get('status')}")

                # Parse the first result
                result = data.get("results", [])[0]
                address = result.get("address_components", [])
                
                # Extract components
                def get_component(types):
                    for comp in address:
                        if any(t in types for t in comp.get("types", [])):
                            return comp.get("long_name")
                    return None

                formatted_result = {
                    "display_name": result.get("formatted_address", ""),
                    "road": get_component(["route"]),
                    "city": get_component(["locality", "sublocality"]),
                    "state": get_component(["administrative_area_level_1"]),
                    "country": get_component(["country"]),
                    "postcode": get_component(["postal_code"]),
                    "neighbourhood": get_component(["neighborhood"]),
                    "suburb": get_component(["sublocality"]),
                    "latitude": result["geometry"]["location"]["lat"],
                    "longitude": result["geometry"]["location"]["lng"],
                }

                # Store in cache
                _cache[cache_key] = (formatted_result, datetime.utcnow())
                return formatted_result

        except Exception as e:
            print(f"Google Geocoding error: {e}")
            # Return a placeholder instead of throwing 500
            return {
                "display_name": "Geocoding service unavailable",
                "road": None,
                "city": None,
                "state": None,
                "country": None,
                "postcode": None,
                "neighbourhood": None,
                "suburb": None,
                "latitude": lat,
                "longitude": lon,
            }

# ============= GOOGLE PLACES (Nearby Multi) =============
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