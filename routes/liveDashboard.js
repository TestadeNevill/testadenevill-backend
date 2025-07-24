const express = require("express");
const axios = require("axios");
const router = express.Router(); // ← this was missing or out of order

router.get("/live-dashboard", async (req, res) => {
  const lat = req.query.lat || DEFAULT_LAT;
  const lng = req.query.lng || DEFAULT_LNG;

  try {
    const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
      params: {
        lat, lon: lng,
        appid: process.env.WEATHER_API_KEY,
        units: 'imperial',
      },
    });

    const fullWeatherList = weatherRes.data.list;
    const currentWeather = fullWeatherList[0];
    const noonForecast = fullWeatherList
      .filter(item => item.dt_txt.includes("12:00:00"))
      .slice(0, 5)
      .map(item => ({
        day: new Date(item.dt_txt).toLocaleDateString("en-US", { weekday: "long" }),
        temp: Math.round(item.main.temp),
        description: item.weather[0].description,
      }));

    const aqiRes = await axios.get(`https://api.waqi.info/feed/here/?token=${process.env.AQI_API_KEY}`);
    const aqiData = aqiRes.data.status === "ok" ? aqiRes.data.data : null;

    const geoRes = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
      params: { latlng: `${lat},${lng}`, key: process.env.GOOGLE_MAPS_KEY }
    });
    const addressComponents = geoRes.data.results[0]?.address_components || [];
    const cityComponent = addressComponents.find(c => c.types.includes("locality"));
    const cityName = cityComponent?.long_name || "Unknown";

    res.json({
      weather: currentWeather,
      forecast: noonForecast,
      aqi: aqiData,
      city: cityName,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      googleKey: process.env.GOOGLE_MAPS_KEY
    });

  } catch (err) {
    console.error("Live Dashboard Error:", err);
    res.status(500).send("Error loading dashboard");
  }
});

module.exports = router;