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
        appid: process.env.REACT_APP_WEATHER_API_KEY,
        units: 'imperial',
      },
    });

    const fullWeatherList = weatherRes.data.list;
    const currentWeather = fullWeatherList[0];
// Group forecasts by day and find daily high temps + an icon
const dailyForecastMap = {};

for (const item of fullWeatherList) {
  const date = new Date(item.dt_txt).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });

  if (!dailyForecastMap[date]) {
    dailyForecastMap[date] = {
      day: date,
      temp: item.main.temp_max,
      icon: item.weather[0].icon,
      description: item.weather[0].description,
    };
  } else {
    if (item.main.temp_max > dailyForecastMap[date].temp) {
      dailyForecastMap[date].temp = item.main.temp_max;
      dailyForecastMap[date].icon = item.weather[0].icon;
      dailyForecastMap[date].description = item.weather[0].description;
    }
  }
}

const noonForecast = Object.values(dailyForecastMap).slice(0, 5).map(item => ({
  day: item.day,
  temp: Math.round(item.temp),
  description: item.description,
  icon: `https://openweathermap.org/img/wn/${item.icon}@2x.png`
}));


    const aqiRes = await axios.get(`https://api.waqi.info/feed/here/?token=${process.env.REACT_APP_AQI_API_KEY}`);
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
  res.status(500).json({ error: "Error loading dashboard" });
}

});
console.log("Weather API Key:", process.env.REACT_APP_WEATHER_API_KEY);


module.exports = router;