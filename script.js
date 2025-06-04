const apiKey = 'b2f95432c02b48a9aaf102104250206';



function searchFromLanding() {
  const city = document.getElementById("cityInputLanding").value;
  if (city.trim() !== "") {
    document.getElementById("landing").style.display = "none";
    document.getElementById("cityInput").value = city; // Set value in hidden city input
    getWeather(); // This must be getWeather() not getWeatherData()
  }
}


window.onload = () => {
  // Don’t auto-fetch weather on load — show landing page
  const modeToggle = document.getElementById('modeToggle');
  if (modeToggle) {
    modeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
    });
  }
};

function detectLocation() {
  document.getElementById("landing").style.display = "none";
  getWeatherByLocation();
}


function getWeatherByLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        fetchWeather(`${latitude},${longitude}`, 'Your Location');
        document.getElementById("landing").style.display = "none";
      },
      () => alert('Geolocation permission denied.')
    );
  } else {
    alert('Geolocation is not supported by this browser.');
  }
}



function getWeather() {
  console.log("getWeather called ✅");
  const cityInput = document.getElementById('cityInput');
  if (!cityInput) return;
  const city = cityInput.value.trim();
  if (!city) {
    alert('Please enter a city name.');
    return;
  }
  fetchWeather(city, city);
}

async function fetchWeather(query, displayName) {
  console.log("fetchWeather called with:", query); 
  try {
    const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(query)}&days=7&aqi=yes&alerts=yes`);
    const data = await response.json();
    console.log("API response:", data); 

    if (data.error) {
      alert(data.error.message);
      return;
    }

    const condition = data.current.condition.text.toLowerCase();
    console.log("Received condition:", condition);

    showCurrentWeather(data.current, displayName);
    showForecast(data.forecast.forecastday);

    // Extract city local hour from data.location.localtime e.g. "2025-06-04 16:22"
    const localTimeStr = data.location.localtime;
    const localHour = parseInt(localTimeStr.split(' ')[1].split(':')[0], 10);

    showHourly(data.forecast.forecastday[0].hour, localHour);
    showRainAlert(data.forecast.forecastday[0].hour, localHour);
    renderAqiChart(data.forecast.forecastday[0].hour);
    showAqiDetails(data.current);
    setBackground(condition);
  } catch (error) {
    alert('An error occurred while fetching the weather data.');
    console.error(error);
  }
}

function showCurrentWeather(current, cityName) {
  console.log("showCurrentWeather called ✅");
  const el = document.getElementById('currentWeather');
  const title = document.getElementById('cityName');
  if (!el || !title) return;

  title.textContent = cityName;

  el.innerHTML = `
    <p><strong>Temperature:</strong> ${current.temp_c}°C</p>
    <p><strong>Condition:</strong> ${current.condition.text}</p>
    <p><strong>Humidity:</strong> ${current.humidity}%</p>
    <p><strong>Wind:</strong> ${current.wind_kph} kph</p>
    <p><strong>UV Index:</strong> ${current.uv}</p>
  `;
  el.classList.remove('hidden');
}

function showForecast(forecastDays) {
  console.log("showforecast called ✅");
  const el = document.getElementById('forecast');
  if (!el) return;
  el.innerHTML = '<h2 style="grid-column: span 4;">7-Day Forecast</h2>';

  forecastDays.forEach(day => {
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    el.innerHTML += `
      <div class="card">
        <h3>${dayName}</h3>
        <p>${date.toLocaleDateString()}</p>
        <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" />
        <p>${day.day.condition.text}</p>
        <p>🌡️ ${Math.round(day.day.mintemp_c)}° / ${Math.round(day.day.maxtemp_c)}°</p>
      </div>
    `;
  });
  el.classList.remove('hidden');
}

function showHourly(hourlyData, localHour) {
  console.log("showhourly called ✅");
  const el = document.getElementById('hourlyForecast');
  if (!el) return;
  el.innerHTML = '<h2 style="grid-column: span 4;">Hourly Forecast (Next 12 hrs)</h2>';

  // Get next 12 hours starting from city local hour
  const next12Hours = [];
  for (let i = 0; i < 12; i++) {
    next12Hours.push(hourlyData[(localHour + i) % 24]);
  }

  next12Hours.forEach(hour => {
    const time = new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    el.innerHTML += `
      <div class="card">
        <p><strong>${time}</strong></p>
        <img src="https:${hour.condition.icon}" alt="${hour.condition.text}" />
        <p>${hour.condition.text}</p>
        <p>${hour.temp_c}°C</p>
      </div>
    `;
  });
  el.classList.remove('hidden');
}

function showRainAlert(hourlyData, localHour) {
  const el = document.getElementById('alertBox');
  if (!el) return;

  // Check next 12 hours for rain based on city local hour
  const next12Hours = [];
  for (let i = 0; i < 12; i++) {
    next12Hours.push(hourlyData[(localHour + i) % 24]);
  }

  const rainHour = next12Hours.find(hour => hour.will_it_rain === 1);
  if (rainHour) {
    const time = new Date(rainHour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    el.textContent = `🌧️ Rain expected around ${time}. Don’t forget your umbrella!`;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

function setBackground(condition) {
  const body = document.body;
  const conditionLower = condition.toLowerCase();

  body.classList.remove(
    'sunny-bg', 'cloudy-bg', 'rainy-bg', 'stormy-bg', 'snowy-bg', 'foggy-bg', 'clear-bg'
  );

  if (conditionLower.includes("sunny")) {
    body.classList.add("sunny-bg");
  } else if (conditionLower.includes("clear")) {
    body.classList.add("clear-bg");
  } else if (conditionLower.includes("cloud") || conditionLower.includes("overcast")) {
    body.classList.add("cloudy-bg");
  } else if (conditionLower.includes("rain") || conditionLower.includes("drizzle")) {
    body.classList.add("rainy-bg");
  } else if (conditionLower.includes("thunder") || conditionLower.includes("storm")) {
    body.classList.add("stormy-bg");
  } else if (conditionLower.includes("snow")) {
    body.classList.add("snowy-bg");
  } else if (conditionLower.includes("fog") || conditionLower.includes("mist") || conditionLower.includes("haze")) {
    body.classList.add("foggy-bg");
  } else {
    body.classList.add("default-bg");
  }
}

function renderAqiChart(hourlyData) {
  const canvas = document.getElementById('aqiChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const labels = hourlyData.map(hour => new Date(hour.time).toLocaleTimeString([], { hour: '2-digit' }));
  const pm25 = hourlyData.map(hour => hour.air_quality?.pm2_5 || 0);
  const pm10 = hourlyData.map(hour => hour.air_quality?.pm10 || 0);

  if (window.aqiChart instanceof Chart) {
    window.aqiChart.destroy();
  }

  window.aqiChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'PM2.5',
          data: pm25,
          borderColor: 'red',
          backgroundColor: 'rgba(255, 0, 0, 0.2)',
          tension: 0.3
        },
        {
          label: 'PM10',
          data: pm10,
          borderColor: 'orange',
          backgroundColor: 'rgba(255, 165, 0, 0.2)',
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

  const container = document.getElementById("aqiChartContainer");
  if (container) container.classList.remove("hidden");
}

function showAqiDetails(current) {
  const el = document.getElementById('aqiDetails');
  if (!el) return;
  const aqi = current.air_quality.pm2_5;

  let aqiCategory = '';
  let color = '';

  if (aqi <= 12) {
    aqiCategory = 'Good';
    color = 'green';
  } else if (aqi <= 35.4) {
    aqiCategory = 'Moderate';
    color = 'yellow';
  } else if (aqi <= 55.4) {
    aqiCategory = 'Unhealthy for Sensitive Groups';
    color = 'orange';
  } else if (aqi <= 150.4) {
    aqiCategory = 'Unhealthy';
    color = 'red';
  } else if (aqi <= 250.4) {
    aqiCategory = 'Very Unhealthy';
    color = 'purple';
  } else {
    aqiCategory = 'Hazardous';
    color = 'maroon';
  }

  el.innerHTML = `
    <h2>Air Quality Info</h2>
    <p><strong>PM2.5:</strong> ${current.air_quality.pm2_5.toFixed(1)} µg/m³</p>
    <p><strong>PM10:</strong> ${current.air_quality.pm10.toFixed(1)} µg/m³</p>
    <p><strong>CO:</strong> ${current.air_quality.co.toFixed(1)} µg/m³</p>
    <p><strong>NO₂:</strong> ${current.air_quality.no2.toFixed(1)} µg/m³</p>
    <p><strong>O₃:</strong> ${current.air_quality.o3.toFixed(1)} µg/m³</p>
    <p><strong>SO₂:</strong> ${current.air_quality.so2.toFixed(1)} µg/m³</p>
    <p style="color:${color}; font-weight:bold;">AQI: ${aqiCategory}</p>
  `;
  el.classList.remove('hidden');
}
