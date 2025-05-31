const apiKey = "c8e629ef26f3c1f613609e9cf09e6fa0"; // Replace with your OpenWeatherMap API key

const modeBtn = document.getElementById("modeToggle");
modeBtn.onclick = () => {
  document.body.classList.toggle("dark-mode");
};

function getWeatherByLocation() {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      fetchWeather(latitude, longitude, "Your Location");
    },
    (err) => alert("Location permission denied.")
  );
}

async function getWeather() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) return alert("Please enter a city name");

  const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`);
  const geoData = await geoRes.json();
  if (!geoData.length) return alert("City not found");

  const { lat, lon, name } = geoData[0];
  fetchWeather(lat, lon, name);
}

async function fetchWeather(lat, lon, cityName) {
  const weatherRes = await fetch(
    `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,alerts&appid=${apiKey}`
  );
  const data = await weatherRes.json();

  showCurrentWeather(data.current, cityName);
  showForecast(data.daily);
  showHourly(data.hourly);
  setBackground(data.current.weather[0].main);
  showRainAlert(data.hourly);
  renderAqiChart(data);
}

function showCurrentWeather(current, cityName) {
  const el = document.getElementById("currentWeather");
  el.innerHTML = `
    <h2>Current Weather in ${cityName}</h2>
    <p><strong>Temperature:</strong> ${current.temp}°C</p>
    <p><strong>Condition:</strong> ${current.weather[0].main} (${current.weather[0].description})</p>
    <p><strong>Humidity:</strong> ${current.humidity}%</p>
    <p><strong>Sunrise:</strong> ${new Date(current.sunrise * 1000).toLocaleTimeString()}</p>
    <p><strong>Sunset:</strong> ${new Date(current.sunset * 1000).toLocaleTimeString()}</p>
  `;
  el.classList.remove("hidden");
}

function showForecast(daily) {
  const el = document.getElementById("forecast");
  el.innerHTML = "<h2 style='grid-column: span 4;'>7-Day Forecast</h2>";

  daily.slice(1, 8).forEach(day => {
    const date = new Date(day.dt * 1000);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const icon = day.weather[0].icon;
    el.innerHTML += `
      <div class="card">
        <h3>${dayName}</h3>
        <p>${date.toLocaleDateString()}</p>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${day.weather[0].main}" />
        <p>${day.weather[0].main}</p>
        <p>🌡️ ${Math.round(day.temp.min)}° / ${Math.round(day.temp.max)}°</p>
      </div>
    `;
  });
  el.classList.remove("hidden");
}

function showHourly(hourly) {
  const el = document.getElementById("hourlyForecast");
  el.innerHTML = "<h2 style='grid-column: span 4;'>Hourly Forecast (Next 12 hrs)</h2>";

  hourly.slice(0, 12).forEach(hour => {
    const time = new Date(hour.dt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const icon = hour.weather[0].icon;
    el.innerHTML += `
      <div class="card">
        <p><strong>${time}</strong></p>
        <img src="https://openweathermap.org/img/wn/${icon}.png" />
        <p>${hour.weather[0].main}</p>
        <p>${hour.temp}°C</p>
      </div>
    `;
  });
  el.classList.remove("hidden");
}

function showRainAlert(hourly) {
  const el = document.getElementById("alertBox");
  const rainHour = hourly.find(h => h.weather[0].main.toLowerCase().includes("rain"));
  if (rainHour) {
    const time = new Date(rainHour.dt * 1000).toLocaleTimeString();
    el.textContent = `🌧️ Rain expected around ${time}. Don’t forget your umbrella!`;
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}

function renderAqiChart(data) {
  const ctx = document.getElementById("aqiChart").getContext("2d");
  const pm25 = data.hourly.slice(0, 12).map((h, i) => h.components?.pm2_5 || Math.random() * 100);
  const pm10 = data.hourly.slice(0, 12).map((h, i) => h.components?.pm10 || Math.random() * 100);
  const labels = data.hourly.slice(0, 12).map(h => new Date(h.dt * 1000).toLocaleTimeString());

  if (window.aqiChart) window.aqiChart.destroy(); // Remove previous chart if exists

  window.aqiChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'PM2.5',
          data: pm25,
          borderColor: 'red',
          backgroundColor: 'rgba(255,0,0,0.2)',
          tension: 0.3
        },
        {
          label: 'PM10',
          data: pm10,
          borderColor: 'orange',
          backgroundColor: 'rgba(255,165,0,0.2)',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Air Quality Index' }
      }
    }
  });

  document.getElementById("aqiChartContainer").classList.remove("hidden");
}

function setBackground(condition) {
  const bgMap = {
    Clear: "url('https://images.unsplash.com/photo-1505483531331-2327bf27c5e4')",
    Rain: "url('https://images.unsplash.com/photo-1523413651479-597eb2da0ad6')",
    Clouds: "url('https://images.unsplash.com/photo-1501630834273-4b5604d2ee31')",
    Snow: "url('https://images.unsplash.com/photo-1608889175610-9f903f5eebfe')",
    Thunderstorm: "url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d')",
    Mist: "url('https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf')",
    default: "url('https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef')"
  };
  document.body.style.backgroundImage = bgMap[condition] || bgMap.default;
}
