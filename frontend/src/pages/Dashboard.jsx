import React, { useEffect, useState } from "react";
import MapView from "../components/MapView";

const Dashboard = () => {

  const [vehicles, setVehicles] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = "https://ai-enabled-emergency-aware-adaptive.onrender.com";

  const fetchData = async () => {
    try {

      const vehicleRes = await fetch(`${API}/live-data`);
      const accidentRes = await fetch(`${API}/accidents`);

      const vehicleData = await vehicleRes.json();
      const accidentData = await accidentRes.json();

      setVehicles(vehicleData);
      setAccidents(accidentData);

      setLoading(false);

    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {

    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);

  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Adaptive Traffic Management Dashboard
      </h1>

      {/* ======================= */}
      {/* STATUS CARDS */}
      {/* ======================= */}

      <div className="grid grid-cols-4 gap-6 mb-8">

        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500">Active Vehicles</p>
          <h2 className="text-2xl font-bold">{vehicles.length}</h2>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500">Accidents Recorded</p>
          <h2 className="text-2xl font-bold text-red-500">
            {accidents.length}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500">Fire Alerts</p>
          <h2 className="text-2xl font-bold text-orange-500">
            {
              vehicles.filter(v => v.fire_detected === true).length
            }
          </h2>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500">Human Presence</p>
          <h2 className="text-2xl font-bold text-green-600">
            {
              vehicles.filter(v => v.human_presence === true).length
            }
          </h2>
        </div>

      </div>

      {/* ======================= */}
      {/* LIVE MAP */}
      {/* ======================= */}

      <div className="mb-10">
        <MapView vehicles={vehicles} accidents={accidents} />
      </div>

      {/* ======================= */}
      {/* SENSOR DATA TABLE */}
      {/* ======================= */}

      <div className="bg-white p-6 rounded-xl shadow mb-10">

        <h2 className="text-xl font-semibold mb-4">
          Live Sensor Data
        </h2>

        <div className="overflow-x-auto">

          <table className="min-w-full text-sm">

            <thead className="bg-gray-100">

              <tr>
                <th className="p-3 text-left">Device</th>
                <th className="p-3 text-left">Speed</th>
                <th className="p-3 text-left">Acceleration</th>
                <th className="p-3 text-left">Tilt</th>
                <th className="p-3 text-left">Fire</th>
                <th className="p-3 text-left">Human</th>
                <th className="p-3 text-left">Breathing</th>
                <th className="p-3 text-left">Location</th>
              </tr>

            </thead>

            <tbody>

              {vehicles.map((v) => (

                <tr key={v._id} className="border-b">

                  <td className="p-3">{v.blackbox_id}</td>

                  <td className="p-3">
                    {v.speed_kmph} km/h
                  </td>

                  <td className="p-3">
                    {v.acceleration_g} g
                  </td>

                  <td className="p-3">
                    {v.tilt_degree}°
                  </td>

                  <td className="p-3">

                    {v.fire_detected ? (
                      <span className="text-red-600 font-semibold">
                        FIRE
                      </span>
                    ) : "Safe"}

                  </td>

                  <td className="p-3">
                    {v.human_presence ? "Yes" : "No"}
                  </td>

                  <td className="p-3">
                    {v.breathing_detected ? "Yes" : "No"}
                  </td>

                  <td className="p-3">
                    {v.latitude.toFixed(4)},
                    {v.longitude.toFixed(4)}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* ======================= */}
      {/* ACCIDENT HISTORY */}
      {/* ======================= */}

      <div className="bg-white p-6 rounded-xl shadow">

        <h2 className="text-xl font-semibold mb-4">
          Accident History
        </h2>

        <table className="min-w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Blackbox</th>
              <th className="p-3 text-left">Speed</th>
              <th className="p-3 text-left">Location</th>
              <th className="p-3 text-left">Time</th>
            </tr>
          </thead>

          <tbody>

            {accidents.map((a) => (

              <tr key={a._id} className="border-b">

                <td className="p-3">{a.blackbox_id}</td>

                <td className="p-3">{a.speed_kmph} km/h</td>

                <td className="p-3">
                  {a.latitude}, {a.longitude}
                </td>

                <td className="p-3">
                  {new Date(a.timestamp).toLocaleString()}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
};

export default Dashboard;