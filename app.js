/* ============================================
   WeatherVerse – app.js
   GPS + OpenWeatherMap API + 3D Animations
   ============================================ */

'use strict';

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  // Free OpenWeatherMap API key — replace with your own from openweathermap.org
  API_KEY: 'bd5e378503939ddaee76f12ad7a97608',
  BASE_URL: 'https://api.openweathermap.org/data/2.5',
  GEO_URL: 'https://api.openweathermap.org/geo/1.0',
  ICON_URL: 'https://openweathermap.org/img/wn',
  UNSPLASH_KEY: null, // optional
};

// ============================================
// STATE
// ============================================
const STATE = {
  unit: 'metric',   // 'metric' (°C) | 'imperial' (°F)
  currentCity: '',
  lat: null,
  lon: null,
  weatherData: null,
  forecastData: null,
  soundEnabled: true,
};

// ============================================
// DOM REFS
// ============================================
const $ = id => document.getElementById(id);
const DOM = {
  loader:        $('loader'),
  errorCard:     $('errorCard'),
  errorMsg:      $('errorMsg'),
  weatherContent:$('weatherContent'),
  cityName:      $('cityName'),
  countryName:   $('countryName'),
  dateTime:      $('dateTime'),
  weatherImg:    $('weatherImg'),
  imgGlow:       $('imgGlow'),
  tempValue:     $('tempValue'),
  tempUnit:      $('tempUnit'),
  feelsLike:     $('feelsLike'),
  weatherDesc:   $('weatherDesc'),
  tempMax:       $('tempMax'),
  tempMin:       $('tempMin'),
  humidity:      $('humidity'),
  humidityBar:   $('humidityBar'),
  windSpeed:     $('windSpeed'),
  windNeedle:    $('windNeedle'),
  windDir:       $('windDir'),
  visibility:    $('visibility'),
  pressure:      $('pressure'),
  sunrise:       $('sunrise'),
  sunset:        $('sunset'),
  uvFill:        $('uvFill'),
  uvThumb:       $('uvThumb'),
  uvValue:       $('uvValue'),
  cloudFill:     $('cloudFill'),
  cloudPct:      $('cloudPct'),
  forecastCards: $('forecastCards'),
  hourlyCards:   $('hourlyCards'),
  mapFrame:      $('mapFrame'),
  searchInput:   $('searchInput'),
  searchBtn:     $('searchBtn'),
  suggestions:   $('suggestions'),
  gpsBtn:        $('gpsBtn'),
  unitToggle:    $('unitToggle'),
  unitLabel:     $('unitLabel'),
  soundBtn:      $('soundBtn'),
};

// ============================================
// PARTICLES INIT
// ============================================
function initParticles() {
  const container = $('particles');
  const count = window.innerWidth < 600 ? 25 : 55;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 3 + 1;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      animation-duration:${Math.random() * 15 + 8}s;
      animation-delay:${Math.random() * -20}s;
      opacity:${Math.random() * 0.5 + 0.1};
    `;
    container.appendChild(p);
  }
}

// ============================================
// WEATHER CONDITION → IMAGE MAPPING (Unsplash)
// ============================================
const WEATHER_IMAGES = {
  clear: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=400&q=80',
  sunny: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400&q=80',
  clouds: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400&q=80',
  rain: 'https://images.unsplash.com/photo-1428592953211-077101b2021b?w=400&q=80',
  drizzle: 'https://images.unsplash.com/photo-1541919329513-35f7af297129?w=400&q=80',
  thunderstorm: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=400&q=80',
  snow: 'https://images.unsplash.com/photo-1547754980-3df97fed72a8?w=400&q=80',
  mist: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&q=80',
  fog: 'https://images.unsplash.com/photo-1483977399921-6cf7b5e46e64?w=400&q=80',
  haze: 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?w=400&q=80',
  dust: 'https://images.unsplash.com/photo-1543152598-8b48b0b34e23?w=400&q=80',
  tornado: 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=400&q=80',
};

function getWeatherImage(condition) {
  const key = condition.toLowerCase();
  if (key.includes('clear') || key.includes('sun')) return WEATHER_IMAGES.clear;
  if (key.includes('thunder') || key.includes('storm')) return WEATHER_IMAGES.thunderstorm;
  if (key.includes('drizzle')) return WEATHER_IMAGES.drizzle;
  if (key.includes('rain')) return WEATHER_IMAGES.rain;
  if (key.includes('snow') || key.includes('sleet') || key.includes('blizzard')) return WEATHER_IMAGES.snow;
  if (key.includes('mist')) return WEATHER_IMAGES.mist;
  if (key.includes('fog')) return WEATHER_IMAGES.fog;
  if (key.includes('haze') || key.includes('smoke')) return WEATHER_IMAGES.haze;
  if (key.includes('dust') || key.includes('sand')) return WEATHER_IMAGES.dust;
  if (key.includes('tornado') || key.includes('squall')) return WEATHER_IMAGES.tornado;
  if (key.includes('cloud') || key.includes('overcast')) return WEATHER_IMAGES.clouds;
  return WEATHER_IMAGES.clear;
}

// ============================================
// WEATHER THEME + OVERLAY
// ============================================
function applyWeatherTheme(conditionId, condition) {
  const body = document.body;
  body.className = '';

  // Remove overlays
  document.querySelectorAll('.rain-overlay,.snow-overlay,.lightning-overlay').forEach(el => el.remove());

  const code = parseInt(conditionId);

  if (code >= 200 && code < 300) {
    body.classList.add('theme-stormy');
    spawnLightning();
    spawnRain(true);
  } else if (code >= 300 && code < 600) {
    body.classList.add('theme-rainy');
    spawnRain(false);
  } else if (code >= 600 && code < 700) {
    body.classList.add('theme-snowy');
    spawnSnow();
  } else if (code >= 700 && code < 800) {
    body.classList.add('theme-cloudy');
  } else if (code === 800) {
    body.classList.add('theme-sunny');
  } else {
    body.classList.add('theme-cloudy');
  }
}

function spawnRain(heavy) {
  const overlay = document.createElement('div');
  overlay.className = 'rain-overlay active';
  const count = heavy ? 120 : 60;
  for (let i = 0; i < count; i++) {
    const drop = document.createElement('div');
    drop.className = 'raindrop';
    const height = Math.random() * 15 + 8;
    drop.style.cssText = `
      left:${Math.random()*100}%;
      height:${height}px;
      animation-duration:${Math.random()*0.6+0.4}s;
      animation-delay:${Math.random()*2}s;
      opacity:${Math.random()*0.5+0.3};
    `;
    overlay.appendChild(drop);
  }
  document.body.appendChild(overlay);
}

function spawnSnow() {
  const overlay = document.createElement('div');
  overlay.className = 'snow-overlay active';
  const flakes = ['❄', '❅', '❆', '*', '·'];
  for (let i = 0; i < 60; i++) {
    const flake = document.createElement('div');
    flake.className = 'snowflake';
    flake.textContent = flakes[Math.floor(Math.random()*flakes.length)];
    flake.style.cssText = `
      left:${Math.random()*100}%;
      font-size:${Math.random()*10+8}px;
      animation-duration:${Math.random()*5+4}s;
      animation-delay:${Math.random()*-8}s;
      opacity:${Math.random()*0.6+0.3};
    `;
    overlay.appendChild(flake);
  }
  document.body.appendChild(overlay);
}

function spawnLightning() {
  const overlay = document.createElement('div');
  overlay.className = 'lightning-overlay';
  document.body.appendChild(overlay);
  setInterval(() => {
    if (Math.random() > 0.7) {
      overlay.classList.add('flash');
      setTimeout(() => overlay.classList.remove('flash'), 300);
    }
  }, 3000);
}

// ============================================
// UI STATE HELPERS
// ============================================
function showLoader() {
  DOM.loader.classList.add('show');
  DOM.errorCard.classList.remove('show');
  DOM.weatherContent.classList.remove('show');
}
function hideLoader() {
  DOM.loader.classList.remove('show');
}
function showError(msg) {
  hideLoader();
  DOM.errorMsg.textContent = msg;
  DOM.errorCard.classList.add('show');
  DOM.weatherContent.classList.remove('show');
}
function showWeather() {
  hideLoader();
  DOM.errorCard.classList.remove('show');
  DOM.weatherContent.classList.add('show');
}

// ============================================
// UNIT HELPERS
// ============================================
function formatTemp(kelvin) {
  if (STATE.unit === 'metric') return Math.round(kelvin - 273.15);
  return Math.round((kelvin - 273.15) * 9/5 + 32);
}
function formatTempDirect(celsius) {
  if (STATE.unit === 'metric') return Math.round(celsius);
  return Math.round(celsius * 9/5 + 32);
}
function unitSymbol() { return STATE.unit === 'metric' ? '°C' : '°F'; }
function windUnit() { return STATE.unit === 'metric' ? 'km/h' : 'mph'; }
function windSpeed(ms) {
  return STATE.unit === 'metric'
    ? Math.round(ms * 3.6)
    : Math.round(ms * 2.237);
}

// ============================================
// DATE HELPERS
// ============================================
function formatDate(timestamp, timezone = 0) {
  const d = new Date((timestamp + timezone) * 1000);
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const utcH = d.getUTCHours().toString().padStart(2,'0');
  const utcM = d.getUTCMinutes().toString().padStart(2,'0');
  return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()} • ${utcH}:${utcM}`;
}
function formatTime(timestamp, timezone = 0) {
  const d = new Date((timestamp + timezone) * 1000);
  let h = d.getUTCHours();
  const m = d.getUTCMinutes().toString().padStart(2,'0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}
function formatHour(timestamp, timezone = 0) {
  const d = new Date((timestamp + timezone) * 1000);
  let h = d.getUTCHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h} ${ampm}`;
}
function getDayName(timestamp, timezone = 0) {
  const d = new Date((timestamp + timezone) * 1000);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return days[d.getUTCDay()];
}

// ============================================
// WIND DIRECTION
// ============================================
function degreesToDirection(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// ============================================
// ICON URL
// ============================================
function iconUrl(code) {
  return `${CONFIG.ICON_URL}/${code}@2x.png`;
}

// ============================================
// FETCH WEATHER DATA
// ============================================
async function fetchWeatherByCoords(lat, lon) {
  showLoader();
  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=metric`),
      fetch(`${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=metric`),
    ]);

    if (!currentRes.ok) throw new Error(currentRes.status === 401
      ? 'Invalid API key. Get a free key at openweathermap.org'
      : 'Weather data unavailable. Try again later.');

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    STATE.weatherData = current;
    STATE.forecastData = forecast;
    STATE.lat = lat;
    STATE.lon = lon;

    renderWeather(current, forecast);
    showWeather();
    speakCityWeather(current);

  } catch (err) {
    showError(err.message || 'Failed to fetch weather data.');
  }
}

async function fetchWeatherByCity(city) {
  showLoader();
  try {
    // Geocode first
    const geoRes = await fetch(
      `${CONFIG.GEO_URL}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${CONFIG.API_KEY}`
    );
    const geoData = await geoRes.json();

    if (!geoData.length) throw new Error(`"${city}" not found. Check the city name.`);

    const { lat, lon } = geoData[0];
    await fetchWeatherByCoords(lat, lon);

  } catch (err) {
    showError(err.message || 'City not found.');
  }
}

// ============================================
// RENDER WEATHER
// ============================================
function renderWeather(data, forecast) {
  const tz = data.timezone;

  // Location
  DOM.cityName.textContent   = data.name;
  DOM.countryName.textContent = `${data.sys.country} • ${data.coord.lat.toFixed(2)}°, ${data.coord.lon.toFixed(2)}°`;
  DOM.dateTime.textContent   = formatDate(data.dt, tz);

  // Temp
  const temp = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const tempMax = Math.round(data.main.temp_max);
  const tempMin = Math.round(data.main.temp_min);

  DOM.tempValue.textContent  = STATE.unit === 'metric' ? temp : Math.round(temp * 9/5 + 32);
  DOM.tempUnit.textContent   = unitSymbol();
  DOM.feelsLike.innerHTML    = `Feels like <strong>${STATE.unit === 'metric' ? feelsLike : Math.round(feelsLike * 9/5 + 32)}${unitSymbol()}</strong>`;
  DOM.tempMax.textContent    = `${STATE.unit === 'metric' ? tempMax : Math.round(tempMax * 9/5 + 32)}${unitSymbol()}`;
  DOM.tempMin.textContent    = `${STATE.unit === 'metric' ? tempMin : Math.round(tempMin * 9/5 + 32)}${unitSymbol()}`;

  // Description
  const condition = data.weather[0];
  DOM.weatherDesc.textContent = condition.description;

  // Weather Image (Unsplash web image)
  DOM.weatherImg.src = getWeatherImage(condition.main);
  DOM.weatherImg.alt = condition.description;

  // Apply Theme + Animations
  applyWeatherTheme(condition.id, condition.main);

  // Stats
  DOM.humidity.textContent    = `${data.main.humidity}%`;
  DOM.humidityBar.style.width = `${data.main.humidity}%`;

  const ws = windSpeed(data.wind.speed);
  DOM.windSpeed.textContent   = `${ws} ${windUnit()}`;
  const windDeg = data.wind.deg || 0;
  DOM.windNeedle.style.transform = `rotate(${windDeg}deg)`;
  DOM.windDir.textContent = degreesToDirection(windDeg);

  DOM.visibility.textContent  = `${(data.visibility / 1000).toFixed(1)} km`;
  DOM.pressure.textContent    = `${data.main.pressure} hPa`;
  DOM.sunrise.textContent     = formatTime(data.sys.sunrise, tz);
  DOM.sunset.textContent      = formatTime(data.sys.sunset, tz);

  // UV — approximate based on clouds and time
  const clouds = data.clouds.all;
  const uvApprox = Math.max(0, Math.round(10 - (clouds / 10)));
  renderUV(uvApprox);

  // Cloud Cover
  DOM.cloudPct.textContent = `${clouds}%`;
  DOM.cloudFill.style.width = `${clouds}%`;

  // 5-Day Forecast
  renderForecast(forecast, tz);

  // Hourly Forecast
  renderHourly(forecast, tz);

  // Map
  renderMap(data.coord.lat, data.coord.lon);
}

// ============================================
// UV INDEX
// ============================================
function renderUV(uv) {
  const pct = Math.min(uv / 11 * 100, 100);
  DOM.uvFill.style.width = `${100 - pct}%`;
  DOM.uvThumb.style.left = `${pct}%`;
  DOM.uvValue.textContent = uv;
  let label = uv <= 2 ? 'Low' : uv <= 5 ? 'Moderate' : uv <= 7 ? 'High' : uv <= 10 ? 'Very High' : 'Extreme';
  DOM.uvValue.textContent = `${uv} – ${label}`;
}

// ============================================
// FORECAST CARDS
// ============================================
function renderForecast(forecast, tz) {
  // Group by day (take noon reading or first of day)
  const daily = {};
  forecast.list.forEach(item => {
    const d = new Date((item.dt + tz) * 1000);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    if (!daily[key]) {
      daily[key] = { items: [], dt: item.dt };
    }
    daily[key].items.push(item);
  });

  const days = Object.values(daily).slice(0, 5);
  DOM.forecastCards.innerHTML = '';

  days.forEach((day, idx) => {
    const temps = day.items.map(i => i.main.temp);
    const max = Math.max(...temps);
    const min = Math.min(...temps);

    // Pick noon or middle item
    const middle = day.items[Math.floor(day.items.length / 2)];
    const icon = middle.weather[0].icon;
    const desc = middle.weather[0].description;
    const rain = middle.pop ? `${Math.round(middle.pop * 100)}%` : '';

    const maxT = STATE.unit === 'metric' ? Math.round(max) : Math.round(max * 9/5 + 32);
    const minT = STATE.unit === 'metric' ? Math.round(min) : Math.round(min * 9/5 + 32);

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.style.animationDelay = `${idx * 0.08}s`;
    card.innerHTML = `
      <div class="forecast-day">${idx === 0 ? 'Today' : getDayName(day.dt, tz)}</div>
      <div class="forecast-icon">
        <img src="${iconUrl(icon)}" alt="${desc}" loading="lazy" />
      </div>
      <div class="forecast-temps">
        <span class="forecast-max">${maxT}${unitSymbol()}</span>
        <span class="forecast-min">${minT}${unitSymbol()}</span>
      </div>
      <div class="forecast-desc">${desc}</div>
      ${rain ? `<div class="hourly-rain"><i class="fas fa-droplet"></i> ${rain}</div>` : ''}
    `;
    DOM.forecastCards.appendChild(card);
  });
}

// ============================================
// HOURLY CARDS
// ============================================
function renderHourly(forecast, tz) {
  const items = forecast.list.slice(0, 8);
  DOM.hourlyCards.innerHTML = '';

  items.forEach((item, idx) => {
    const temp = STATE.unit === 'metric'
      ? Math.round(item.main.temp)
      : Math.round(item.main.temp * 9/5 + 32);
    const icon = item.weather[0].icon;
    const pop = item.pop ? `${Math.round(item.pop * 100)}%` : '';

    const card = document.createElement('div');
    card.className = 'hourly-card';
    card.style.animationDelay = `${idx * 0.06}s`;
    card.innerHTML = `
      <div class="hourly-time">${formatHour(item.dt, tz)}</div>
      <div class="hourly-icon">
        <img src="${iconUrl(icon)}" alt="" loading="lazy" />
      </div>
      <div class="hourly-temp">${temp}${unitSymbol()}</div>
      ${pop ? `<div class="hourly-rain">${pop}</div>` : ''}
    `;
    DOM.hourlyCards.appendChild(card);
  });
}

// ============================================
// MAP
// ============================================
function renderMap(lat, lon) {
  DOM.mapFrame.src = `https://maps.google.com/maps?q=${lat},${lon}&z=10&output=embed`;
}

// ============================================
// GPS GEOLOCATION
// ============================================
function getGPSLocation() {
  if (!navigator.geolocation) {
    showError('GPS not supported by your browser.');
    return;
  }
  DOM.gpsBtn.classList.add('loading');
  DOM.gpsBtn.disabled = true;

  navigator.geolocation.getCurrentPosition(
    pos => {
      DOM.gpsBtn.classList.remove('loading');
      DOM.gpsBtn.disabled = false;
      fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    err => {
      DOM.gpsBtn.classList.remove('loading');
      DOM.gpsBtn.disabled = false;
      const msgs = {
        1: 'Location access denied. Please allow location permission.',
        2: 'Unable to get location. Check your connection.',
        3: 'Location request timed out.',
      };
      showError(msgs[err.code] || 'GPS error occurred.');
    },
    { timeout: 10000, maximumAge: 300000 }
  );
}

// ============================================
// UNIT TOGGLE
// ============================================
function toggleUnit() {
  STATE.unit = STATE.unit === 'metric' ? 'imperial' : 'metric';
  DOM.unitLabel.textContent = STATE.unit === 'metric' ? '°C' : '°F';

  // Re-render if we have data
  if (STATE.weatherData && STATE.forecastData) {
    renderWeather(STATE.weatherData, STATE.forecastData);
    showWeather();
    // Unit toggle pe speech nahi — sirf city search/GPS pe
  }
}

// ============================================
// SEARCH AUTOCOMPLETE
// ============================================
let suggestTimer = null;
async function fetchSuggestions(query) {
  if (query.length < 2) {
    hideSuggestions();
    return;
  }
  try {
    const res = await fetch(
      `${CONFIG.GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${CONFIG.API_KEY}`
    );
    const data = await res.json();
    if (!data.length) { hideSuggestions(); return; }

    DOM.suggestions.innerHTML = '';
    data.forEach(place => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      const name = `${place.name}${place.state ? ', ' + place.state : ''}, ${place.country}`;
      item.innerHTML = `<i class="fas fa-location-dot"></i> ${name}`;
      item.addEventListener('click', () => {
        DOM.searchInput.value = place.name;
        hideSuggestions();
        fetchWeatherByCoords(place.lat, place.lon);
      });
      DOM.suggestions.appendChild(item);
    });
    DOM.suggestions.classList.add('show');
  } catch (_) { hideSuggestions(); }
}

function hideSuggestions() {
  DOM.suggestions.classList.remove('show');
  DOM.suggestions.innerHTML = '';
}

// ============================================
// 3D CARD TILT ON MOUSE MOVE
// ============================================
function initCardTilt() {
  const card = document.querySelector('.hero-card-inner');
  if (!card || window.innerWidth < 768) return;

  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotY = ((x - centerX) / centerX) * 6;
    const rotX = -((y - centerY) / centerY) * 4;
    card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(10px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
}

// ============================================
// RIPPLE EFFECT ON BUTTONS
// ============================================
function addRipple(e) {
  const btn = e.currentTarget;
  const ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  ripple.style.cssText = `
    width:${size}px; height:${size}px;
    left:${e.clientX - rect.left - size/2}px;
    top:${e.clientY - rect.top - size/2}px;
  `;
  btn.style.position = 'relative';
  btn.style.overflow = 'hidden';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
}

// ============================================
// TEXT-TO-SPEECH — CITY WEATHER ANNOUNCEMENT
// ============================================
function speakCityWeather(data) {
  if (!STATE.soundEnabled) return;
  if (!window.speechSynthesis) return;

  // Cancel any ongoing speech first
  window.speechSynthesis.cancel();

  const city    = data.name;
  const country = data.sys.country;
  const desc    = data.weather[0].description;
  const temp    = Math.round(data.main.temp);
  const unit    = STATE.unit === 'metric' ? 'degrees Celsius' : 'degrees Fahrenheit';
  const displayTemp = STATE.unit === 'metric' ? temp : Math.round(temp * 9/5 + 32);
  const humidity = data.main.humidity;
  const windSpd  = Math.round(data.wind.speed * 3.6);

  const text = `Weather update for ${city}, ${country}. 
    Current condition: ${desc}. 
    Temperature is ${displayTemp} ${unit}. 
    Humidity is ${humidity} percent. 
    Wind speed is ${windSpd} kilometers per hour.`;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang   = 'en-US';
  utterance.rate   = 0.92;   // thoda slow — clear pronunciation
  utterance.pitch  = 1.05;
  utterance.volume = 1;

  // Pick best available voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes('Google') && v.lang === 'en-US'
  ) || voices.find(v =>
    v.lang === 'en-US'
  ) || voices.find(v =>
    v.lang.startsWith('en')
  );
  if (preferred) utterance.voice = preferred;

  window.speechSynthesis.speak(utterance);

  // Button animation — speaking indicator
  if (DOM.soundBtn) {
    DOM.soundBtn.classList.add('speaking');
    utterance.onend = () => DOM.soundBtn.classList.remove('speaking');
    utterance.onerror = () => DOM.soundBtn.classList.remove('speaking');
  }
}

// Voices load hone ka wait (Chrome mein async load hoti hain)
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices(); // cache
  };
}

// ============================================
// EVENT LISTENERS
// ============================================
function initEvents() {
  // Search
  DOM.searchBtn.addEventListener('click', e => {
    addRipple(e);
    const query = DOM.searchInput.value.trim();
    if (query) { hideSuggestions(); fetchWeatherByCity(query); }
  });

  DOM.searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const query = DOM.searchInput.value.trim();
      if (query) { hideSuggestions(); fetchWeatherByCity(query); }
    }
  });

  DOM.searchInput.addEventListener('input', e => {
    clearTimeout(suggestTimer);
    suggestTimer = setTimeout(() => fetchSuggestions(e.target.value.trim()), 350);
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.search-box-3d')) hideSuggestions();
  });

  // GPS
  DOM.gpsBtn.addEventListener('click', e => {
    addRipple(e);
    getGPSLocation();
  });

  // Unit toggle
  DOM.unitToggle.addEventListener('click', toggleUnit);

  // Sound toggle
  DOM.soundBtn.addEventListener('click', () => {
    STATE.soundEnabled = !STATE.soundEnabled;
    window.speechSynthesis.cancel();
    DOM.soundBtn.classList.remove('speaking');
    if (STATE.soundEnabled) {
      DOM.soundBtn.classList.remove('muted');
      DOM.soundBtn.innerHTML = '<i class="fas fa-volume-high"></i>';
      DOM.soundBtn.title = 'Voice ON — Click to mute';
      // Agar data hai to abhi bolo
      if (STATE.weatherData) speakCityWeather(STATE.weatherData);
    } else {
      DOM.soundBtn.classList.add('muted');
      DOM.soundBtn.innerHTML = '<i class="fas fa-volume-xmark"></i>';
      DOM.soundBtn.title = 'Voice OFF — Click to unmute';
    }
  });
}

// ============================================
// DEFAULT CITY ON LOAD
// ============================================
function loadDefaultCity() {
  // Try GPS first
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeatherByCity('London') // fallback
    );
  } else {
    fetchWeatherByCity('London');
  }
}

// ============================================
// INIT APP
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initEvents();
  initCardTilt();
  initInfographicEvents();
  loadDefaultCity();

  // Re-init tilt after weather renders
  const observer = new MutationObserver(() => {
    initCardTilt();
    // Auto-refresh infographic if it's open
    if (IG.overlay.classList.contains('open') && STATE.weatherData && STATE.forecastData) {
      renderInfographic(STATE.weatherData, STATE.forecastData);
    }
  });
  observer.observe(DOM.weatherContent, { attributes: true, attributeFilter: ['class'] });
});


// ============================================================
// INFOGRAPHIC MODE — DOM REFS
// ============================================================
const IG = {
  overlay:       $('infographicOverlay'),
  closeBtn:      $('igCloseBtn'),
  openBtn:       $('infographicBtn'),
  tabs:          document.querySelectorAll('.ig-tab'),
  panels:        document.querySelectorAll('.ig-panel'),
  // Current
  tickerText:    $('igTickerText'),
  city:          $('igCity'),
  country:       $('igCountry'),
  date:          $('igDate'),
  heroImg:       $('igHeroImg'),
  temp:          $('igTemp'),
  tempSym:       $('igTempSym'),
  condition:     $('igCondition'),
  feels:         $('igFeels'),
  humidity:      $('igHumidity'),
  wind:          $('igWind'),
  pressure:      $('igPressure'),
  vis:           $('igVis'),
  cloud:         $('igCloud'),
  sunrise:       $('igSunrise'),
  sunset:        $('igSunset'),
  arcPath:       $('igArcPath'),
  sunDot:        $('igSunDot'),
  // Daily
  dailyCity:     $('igDailyCity'),
  dailyCards:    $('igDailyCards'),
  tempCanvas:    $('igTempCanvas'),
  // Weekly
  weeklyCity:    $('igWeeklyCity'),
  weeklyRows:    $('igWeeklyRows'),
  condChips:     $('igConditionChips'),
};

// ============================================================
// OPEN / CLOSE INFOGRAPHIC
// ============================================================
function openInfographic() {
  if (!STATE.weatherData || !STATE.forecastData) {
    showError('Please search for a city first.');
    return;
  }
  IG.overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  // render active tab
  renderInfographic(STATE.weatherData, STATE.forecastData);
}

function closeInfographic() {
  IG.overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ============================================================
// TAB SWITCHING
// ============================================================
function switchIgTab(tabName) {
  IG.tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
  IG.panels.forEach(p => {
    const id = 'igPanel' + tabName.charAt(0).toUpperCase() + tabName.slice(1);
    p.classList.toggle('active', p.id === id);
  });
  // Re-draw graph if daily tab
  if (tabName === 'daily' && STATE.forecastData) {
    setTimeout(() => drawTempGraph(STATE.forecastData, STATE.weatherData.timezone), 100);
  }
}

// ============================================================
// MASTER RENDER — called whenever infographic opens or data updates
// ============================================================
function renderInfographic(data, forecast) {
  renderIgCurrent(data);
  renderIgDaily(forecast, data.timezone);
  renderIgWeekly(forecast, data.timezone);
}

// ============================================================
// TAB 1 — CURRENT CONDITIONS
// ============================================================
function renderIgCurrent(data) {
  const tz  = data.timezone;
  const w   = data.weather[0];
  const t   = Math.round(data.main.temp);
  const fl  = Math.round(data.main.feels_like);
  const disp = v => STATE.unit === 'metric' ? v : Math.round(v * 9/5 + 32);

  // Location + time
  IG.city.textContent      = data.name;
  IG.country.textContent   = data.sys.country;
  IG.date.textContent      = formatDate(data.dt, tz);

  // Icon (Unsplash full scene image)
  IG.heroImg.src           = getWeatherImage(w.main);
  IG.heroImg.alt           = w.description;

  // Temperature
  IG.temp.textContent      = disp(t);
  IG.tempSym.textContent   = unitSymbol();
  IG.condition.textContent = w.description;

  // Stats
  const hum  = data.main.humidity;
  const ws   = windSpeed(data.wind.speed);
  const pres = data.main.pressure;
  const visK = (data.visibility / 1000).toFixed(1);
  const cld  = data.clouds.all;

  IG.feels.textContent    = `${disp(fl)}${unitSymbol()}`;
  IG.humidity.textContent = `${hum}%`;
  IG.wind.textContent     = `${ws} ${windUnit()}`;
  IG.pressure.textContent = `${pres} hPa`;
  IG.vis.textContent      = `${visK} km`;
  IG.cloud.textContent    = `${cld}%`;
  IG.sunrise.textContent  = formatTime(data.sys.sunrise, tz);
  IG.sunset.textContent   = formatTime(data.sys.sunset, tz);

  // Animated mini bars (percentage scale)
  const bars = [
    { el: $('igFeelsBar'),    pct: Math.min(Math.abs(disp(fl)) / 50, 1) },
    { el: $('igHumidityBar'), pct: hum / 100 },
    { el: $('igWindBar'),     pct: Math.min(ws / 120, 1) },
    { el: $('igPressureBar'), pct: Math.min((pres - 950) / 110, 1) },
    { el: $('igVisBar'),      pct: Math.min(parseFloat(visK) / 10, 1) },
    { el: $('igCloudBar'),    pct: cld / 100 },
  ];
  // Stagger bar animations
  bars.forEach((b, i) => {
    if (!b.el) return;
    b.el.style.setProperty('--bar-scale', b.pct);
    setTimeout(() => b.el.classList.add('animated'), i * 120 + 300);
  });

  // Sun arc animation
  animateSunArc(data.sys.sunrise, data.sys.sunset, data.dt, tz);

  // Ticker text
  const tickerMsg = `📍 ${data.name}, ${data.sys.country}  •  `
    + `🌡 ${disp(t)}${unitSymbol()} — ${w.description}  •  `
    + `💧 Humidity ${hum}%  •  `
    + `💨 Wind ${ws} ${windUnit()}  •  `
    + `🌅 Sunrise ${formatTime(data.sys.sunrise, tz)}  •  `
    + `🌇 Sunset ${formatTime(data.sys.sunset, tz)}  •  `
    + `👁 Visibility ${visK} km  •  `
    + `📊 Pressure ${pres} hPa  •  `;
  IG.tickerText.textContent = tickerMsg + tickerMsg; // doubled for seamless loop
}

// ============================================================
// SUN ARC ANIMATION
// ============================================================
function animateSunArc(sunrise, sunset, now, tz) {
  const arcPath = $('igArcPath');
  const sunDot  = $('igSunDot');
  if (!arcPath || !sunDot) return;

  const totalLen = 400; // approximate SVG path length
  const dayLen   = sunset - sunrise;
  const elapsed  = Math.max(0, Math.min(now - sunrise, dayLen));
  const progress = dayLen > 0 ? elapsed / dayLen : 0;

  // Animate arc fill
  setTimeout(() => {
    arcPath.style.strokeDashoffset = totalLen * (1 - progress);
  }, 500);

  // Move sun dot along the quadratic bezier Q 150 0 280 110
  // parametric: P(t) = (1-t)²*P0 + 2t(1-t)*P1 + t²*P2
  const t  = progress;
  const p0 = { x: 20,  y: 110 };
  const p1 = { x: 150, y: 0   };
  const p2 = { x: 280, y: 110 };
  const cx = (1-t)*(1-t)*p0.x + 2*(1-t)*t*p1.x + t*t*p2.x;
  const cy = (1-t)*(1-t)*p0.y + 2*(1-t)*t*p1.y + t*t*p2.y;

  setTimeout(() => {
    sunDot.setAttribute('cx', cx.toFixed(1));
    sunDot.setAttribute('cy', cy.toFixed(1));
  }, 600);
}

// ============================================================
// TAB 2 — DAILY (HOURLY) CARDS + CANVAS GRAPH
// ============================================================
function renderIgDaily(forecast, tz) {
  IG.dailyCity.textContent = STATE.weatherData ? STATE.weatherData.name : '--';

  // Take first 8 hourly slots (24 hrs)
  const items = forecast.list.slice(0, 8);
  IG.dailyCards.innerHTML = '';

  items.forEach((item, i) => {
    const t     = STATE.unit === 'metric'
      ? Math.round(item.main.temp)
      : Math.round(item.main.temp * 9/5 + 32);
    const icon  = item.weather[0].icon;
    const desc  = item.weather[0].description;
    const pop   = item.pop ? Math.round(item.pop * 100) : 0;
    const isNow = i === 0;

    const card = document.createElement('div');
    card.className = 'ig-daily-card' + (isNow ? ' today' : '');
    card.style.setProperty('--ci', i);
    card.innerHTML = `
      <div class="ig-dcard-day ${isNow ? 'today-label' : ''}">${isNow ? 'NOW' : formatHour(item.dt, tz)}</div>
      <div class="ig-dcard-icon">
        <img src="${iconUrl(icon)}" alt="${desc}" loading="lazy" />
      </div>
      <div class="ig-dcard-temps">
        <span class="ig-dcard-max">${t}${unitSymbol()}</span>
      </div>
      <div class="ig-dcard-desc">${desc}</div>
      ${pop > 0 ? `<div class="ig-dcard-pop"><i class="fas fa-droplet"></i>${pop}%</div>` : ''}
    `;
    IG.dailyCards.appendChild(card);
  });

  // Canvas graph drawn with slight delay so canvas has layout dimensions
  setTimeout(() => drawTempGraph(forecast, tz), 150);
}

// ============================================================
// CANVAS TEMPERATURE GRAPH
// ============================================================
function drawTempGraph(forecast, tz) {
  const canvas = IG.tempCanvas;
  if (!canvas) return;

  const parent = canvas.parentElement;
  canvas.width  = parent.offsetWidth  || 600;
  canvas.height = parent.offsetHeight || 120;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const items = forecast.list.slice(0, 8);
  const temps = items.map(it =>
    STATE.unit === 'metric'
      ? Math.round(it.main.temp)
      : Math.round(it.main.temp * 9/5 + 32)
  );
  const labels = items.map(it => formatHour(it.dt, tz));

  const W = canvas.width;
  const H = canvas.height;
  const padL = 36, padR = 16, padT = 20, padB = 38;
  const gW = W - padL - padR;
  const gH = H - padT - padB;

  const minT = Math.min(...temps) - 2;
  const maxT = Math.max(...temps) + 2;
  const range = maxT - minT || 1;

  const xOf = i => padL + (i / (temps.length - 1)) * gW;
  const yOf = v => padT + gH - ((v - minT) / range) * gH;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const y = padT + (g / 4) * gH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
  }

  // Gradient fill under the curve
  const grad = ctx.createLinearGradient(0, padT, 0, H - padB);
  grad.addColorStop(0, 'rgba(108,99,255,0.35)');
  grad.addColorStop(1, 'rgba(108,99,255,0)');

  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(temps[0]));
  for (let i = 1; i < temps.length; i++) {
    const cpx = (xOf(i - 1) + xOf(i)) / 2;
    ctx.bezierCurveTo(cpx, yOf(temps[i-1]), cpx, yOf(temps[i]), xOf(i), yOf(temps[i]));
  }
  ctx.lineTo(xOf(temps.length - 1), H - padB);
  ctx.lineTo(xOf(0), H - padB);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line stroke
  const lineGrad = ctx.createLinearGradient(padL, 0, W - padR, 0);
  lineGrad.addColorStop(0,   '#6c63ff');
  lineGrad.addColorStop(0.5, '#00cec9');
  lineGrad.addColorStop(1,   '#fd79a8');

  ctx.beginPath();
  ctx.moveTo(xOf(0), yOf(temps[0]));
  for (let i = 1; i < temps.length; i++) {
    const cpx = (xOf(i - 1) + xOf(i)) / 2;
    ctx.bezierCurveTo(cpx, yOf(temps[i-1]), cpx, yOf(temps[i]), xOf(i), yOf(temps[i]));
  }
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Dots + labels
  temps.forEach((v, i) => {
    const x = xOf(i), y = yOf(v);

    // Glow dot
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#6c63ff';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Temp label above dot
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${v}°`, x, y - 10);

    // Hour label below axis
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(labels[i], x, H - padB + 16);
  });
}

// ============================================================
// TAB 3 — WEEKLY OUTLOOK
// ============================================================
function renderIgWeekly(forecast, tz) {
  IG.weeklyCity.textContent = STATE.weatherData ? STATE.weatherData.name : '--';

  // Group forecast into daily buckets (5 days)
  const daily = {};
  forecast.list.forEach(item => {
    const d = new Date((item.dt + tz) * 1000);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    if (!daily[key]) daily[key] = { items: [], dt: item.dt, date: d };
    daily[key].items.push(item);
  });

  const days   = Object.values(daily).slice(0, 5);
  const allMin = days.map(d => Math.min(...d.items.map(i => i.main.temp_min)));
  const allMax = days.map(d => Math.max(...d.items.map(i => i.main.temp_max)));
  const absMin = Math.min(...allMin);
  const absMax = Math.max(...allMax);
  const absRange = absMax - absMin || 1;

  IG.weeklyRows.innerHTML = '';
  const condSet = {};

  days.forEach((day, wi) => {
    const temps  = day.items.map(i => i.main.temp);
    const maxT   = Math.max(...day.items.map(i => i.main.temp_max));
    const minT   = Math.min(...day.items.map(i => i.main.temp_min));
    const mid    = day.items[Math.floor(day.items.length / 2)];
    const icon   = mid.weather[0].icon;
    const desc   = mid.weather[0].description;
    const pop    = mid.pop ? Math.round(mid.pop * 100) : 0;
    const isToday = wi === 0;

    const disp = v => STATE.unit === 'metric' ? Math.round(v) : Math.round(v * 9/5 + 32);

    // range bar positions (as % of global range)
    const leftPct  = ((minT - absMin) / absRange * 100).toFixed(1);
    const rightPct = (100 - (maxT - absMin) / absRange * 100).toFixed(1);

    // Full date label
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dateLabel = `${months[day.date.getUTCMonth()]} ${day.date.getUTCDate()}`;
    const fullDays  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const dayName   = isToday ? 'Today' : fullDays[day.date.getUTCDay()];

    const row = document.createElement('div');
    row.className = 'ig-week-row' + (isToday ? ' today-row' : '');
    row.style.setProperty('--wi', wi);
    row.innerHTML = `
      <div class="ig-wrow-day">
        ${dayName}
        <span>${dateLabel}</span>
      </div>
      <div class="ig-wrow-icon">
        <img src="${iconUrl(icon)}" alt="${desc}" loading="lazy" />
      </div>
      <div class="ig-wrow-range">
        <span class="ig-range-min">${disp(minT)}°</span>
        <div class="ig-range-bar-track">
          <div class="ig-range-bar-fill" style="left:${leftPct}%; right:${rightPct}%"></div>
        </div>
        <span class="ig-range-max">${disp(maxT)}°</span>
      </div>
      <div class="ig-wrow-desc">${desc}</div>
      <div class="ig-wrow-pop">
        <i class="fas fa-droplet"></i>${pop}%
      </div>
    `;
    IG.weeklyRows.appendChild(row);

    // Collect unique conditions for chips
    const mainCond = mid.weather[0].main;
    if (!condSet[mainCond]) {
      condSet[mainCond] = { icon: icon, count: 0 };
    }
    condSet[mainCond].count++;
  });

  // Condition summary chips
  IG.condChips.innerHTML = '';
  Object.entries(condSet).forEach(([cond, val], ci) => {
    const chip = document.createElement('div');
    chip.className = 'ig-chip';
    chip.style.animationDelay = `${ci * 0.07}s`;
    chip.innerHTML = `
      <img src="${iconUrl(val.icon)}" alt="${cond}" />
      ${cond} <span style="opacity:0.45;margin-left:4px">×${val.count}</span>
    `;
    IG.condChips.appendChild(chip);
  });
}

// ============================================================
// INFOGRAPHIC EVENT LISTENERS
// ============================================================
function initInfographicEvents() {
  // Open
  IG.openBtn.addEventListener('click', e => {
    addRipple(e);
    openInfographic();
  });

  // Close
  IG.closeBtn.addEventListener('click', closeInfographic);

  // Close on backdrop (click outside panel area)
  IG.overlay.addEventListener('click', e => {
    if (e.target === IG.overlay) closeInfographic();
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && IG.overlay.classList.contains('open')) {
      closeInfographic();
    }
  });

  // Tab switching
  IG.tabs.forEach(tab => {
    tab.addEventListener('click', () => switchIgTab(tab.dataset.tab));
  });

  // Redraw graph on resize (if daily tab active)
  window.addEventListener('resize', () => {
    const dailyPanel = $('igPanelDaily');
    if (dailyPanel && dailyPanel.classList.contains('active') && STATE.forecastData) {
      drawTempGraph(STATE.forecastData, STATE.weatherData?.timezone || 0);
    }
  });
}

// Hook into renderWeather so infographic auto-updates if already open
// (handled via MutationObserver in DOMContentLoaded)
