# backend/utils/notifications.py
import os
from twilio.rest import Client

def make_emergency_call(accident_data: dict):
    """Initiate a voice call to the emergency contact."""
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_number = os.getenv("TWILIO_PHONE_NUMBER")
    emergency_number = os.getenv("EMERGENCY_CONTACT_NUMBER")

    if not all([account_sid, auth_token, twilio_number, emergency_number]):
        print("⚠️ Twilio credentials missing – cannot place call")
        return

    client = Client(account_sid, auth_token)
    location = f"{accident_data['latitude']}, {accident_data['longitude']}"
    message = f"Emergency alert. An accident has been detected at coordinates {location}. Please respond immediately."

    twiml_bin_url = os.getenv("TWIML_BIN_URL")

    try:
        call = client.calls.create(
            url=twiml_bin_url,
            to=emergency_number,
            from_=twilio_number
        )
        print(f"📞 Emergency call initiated: {call.sid}")
    except Exception as e:
        print(f"❌ Failed to place call: {e}")