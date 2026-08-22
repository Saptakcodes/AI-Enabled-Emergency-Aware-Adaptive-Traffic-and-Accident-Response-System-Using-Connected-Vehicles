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
    """
    if not VITE_GOOGLE_MAPS_API_KEY:
        raise HTTPException(status_code=500, detail="Google API key not configured")

    cache_key = f"{lat},{lon}"
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

                result = data.get("results", [])[0]
                address = result.get("address_components", [])
                
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
                _cache[cache_key] = (formatted_result, datetime.utcnow())
                return formatted_result

        except Exception as e:
            print(f"Google Geocoding error: {e}")
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

# ============= GOOGLE PLACES (Nearby Multi) with Radius Fallback =============
@router.get("/nearby-multi")
async def nearby_places_multi_google(
    lat: float,
    lon: float,
    types: str = "hospital,police,fire_station",
    radius: int = 5000  # initial radius in meters
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Find nearby places using Google Places API.
    For hospitals, filters only those with 'hospital' in types.
    If no results, increases radius by 5 km up to 20 km.
    """
    if not VITE_GOOGLE_MAPS_API_KEY:
        raise HTTPException(status_code=500, detail="Google API key not configured")

    type_list = [t.strip() for t in types.split(",")]
    results = {t: [] for t in type_list}

    # Define max radius (20 km) and step (5 km)
    MAX_RADIUS = 20000  # 20 km
    STEP = 5000         # 5 km

    async with aiohttp.ClientSession() as session:
        for place_type in type_list:
            current_radius = radius
            found = False
            attempts = 0

            while not found and current_radius <= MAX_RADIUS:
                attempts += 1
                url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
                params = {
                    "location": f"{lat},{lon}",
                    "radius": current_radius,
                    "type": place_type,
                    "key": VITE_GOOGLE_MAPS_API_KEY,
                }
                try:
                    async with session.get(url, params=params, timeout=10) as resp:
                        if resp.status != 200:
                            break
                        data = await resp.json()
                        if data.get("status") != "OK":
                            # If no results, increase radius and try again
                            if data.get("status") == "ZERO_RESULTS":
                                current_radius += STEP
                                continue
                            else:
                                # Other error (e.g., REQUEST_DENIED)
                                break

                        # Filter results based on place_type
                        filtered = []
                        for p in data.get("results", []):
                            # For hospitals, only include places that have "hospital" in their types
                            if place_type == "hospital":
                                p_types = p.get("types", [])
                                if "hospital" not in p_types:
                                    continue  # skip clinics, doctors, etc.
                            # For police and fire_station, accept all (they are more specific)
                            p_lat = p["geometry"]["location"]["lat"]
                            p_lon = p["geometry"]["location"]["lng"]
                            R = 6371000
                            dlat = radians(p_lat - lat)
                            dlon = radians(p_lon - lon)
                            a = sin(dlat/2)**2 + cos(radians(lat)) * cos(radians(p_lat)) * sin(dlon/2)**2
                            c = 2 * atan2(sqrt(a), sqrt(1-a))
                            distance = R * c

                            filtered.append({
                                "name": p.get("name", "Unnamed"),
                                "lat": p_lat,
                                "lon": p_lon,
                                "distance": distance,
                                "vicinity": p.get("vicinity", "")
                            })

                        if filtered:
                            results[place_type] = sorted(filtered, key=lambda x: x["distance"])
                            found = True
                        else:
                            # No results after filtering, increase radius
                            current_radius += STEP

                except Exception as e:
                    print(f"Google Places request failed for {place_type}: {e}")
                    break

            # If after all attempts still no results, leave empty list
            if not found:
                results[place_type] = []

    return results