import { useEffect, useState } from 'react';

const weatherCodeMap = {
  0: 'Clear sky',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  82: 'Violent rain showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm',
};

async function fetchJson(url, serviceName) {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Unable to reach ${serviceName}. Check your internet connection and try again.`);
    }
    throw error;
  }

  if (!response.ok) {
    throw new Error(`${serviceName} is unavailable. Please try again later.`);
  }

  try {
    return await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`${serviceName} returned invalid data. Please try again later.`);
    }
    throw error;
  }
}

function getRecommendation(temp, code) {
  if (temp >= 30) return 'High heat: carry water and plan for shade.';
  if (temp <= 5) return 'Cold day: wear warm layers.';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return 'Rain expected: carry an umbrella.';
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return 'Snow is expected: dress warmly and check local travel conditions.';
  }
  return 'Good conditions for outdoor plans.';
}

function ForecastChart({ daily }) {
  const width = 700;
  const height = 260;
  const padding = { top: 28, right: 28, bottom: 42, left: 44 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = [...daily.temperature_2m_max, ...daily.temperature_2m_min];
  const minTemperature = Math.min(...values);
  const maxTemperature = Math.max(...values);
  const temperatureRange = maxTemperature - minTemperature || 1;
  const x = (index) => padding.left + (index * chartWidth) / (daily.time.length - 1);
  const y = (temperature) =>
    padding.top + ((maxTemperature - temperature) / temperatureRange) * chartHeight;
  const makePath = (temperatures) =>
    temperatures
      .map((temperature, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(temperature)}`)
      .join(' ');
  const dateLabel = (date) =>
    new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <figure className="chart-card">
      <figcaption>
        <h3>7-day temperature trend</h3>
        <div className="chart-legend" aria-label="Chart legend">
          <span><i className="legend-high" /> High</span>
          <span><i className="legend-low" /> Low</span>
        </div>
      </figcaption>
      <div className="chart-scroll">
        <svg
          className="forecast-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-labelledby="chart-title chart-description"
        >
          <title id="chart-title">Seven-day high and low temperatures</title>
          <desc id="chart-description">
            Daily high and low temperatures in degrees Celsius for the next seven days.
          </desc>
          {[0, 0.5, 1].map((fraction) => {
            const temperature = maxTemperature - fraction * temperatureRange;
            const lineY = padding.top + fraction * chartHeight;
            return (
              <g key={fraction} className="chart-gridline">
                <line x1={padding.left} x2={width - padding.right} y1={lineY} y2={lineY} />
                <text x={padding.left - 10} y={lineY + 4} textAnchor="end">
                  {Math.round(temperature)}°
                </text>
              </g>
            );
          })}
          <path className="temperature-line high-line" d={makePath(daily.temperature_2m_max)} />
          <path className="temperature-line low-line" d={makePath(daily.temperature_2m_min)} />
          {daily.time.map((day, index) => (
            <g key={day} className="chart-day">
              <circle className="high-point" cx={x(index)} cy={y(daily.temperature_2m_max[index])} r="4" />
              <circle className="low-point" cx={x(index)} cy={y(daily.temperature_2m_min[index])} r="4" />
              <text x={x(index)} y={height - 12} textAnchor="middle">{dateLabel(day)}</text>
            </g>
          ))}
        </svg>
      </div>
    </figure>
  );
}

function App() {
  const [city, setCity] = useState('Chennai');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWeather = async (cityName) => {
    setLoading(true);
    setError('');

    try {
      const geoParams = new URLSearchParams({
        name: cityName,
        count: '1',
        language: 'en',
        format: 'json',
      });
      const geoData = await fetchJson(
        `https://geocoding-api.open-meteo.com/v1/search?${geoParams.toString()}`,
        'The location service'
      );

      if (!geoData || typeof geoData !== 'object' || Array.isArray(geoData)) {
        throw new Error('The location service returned invalid data. Please try again later.');
      }
      if (geoData.results == null || (Array.isArray(geoData.results) && geoData.results.length === 0)) {
        throw new Error('City not found. Try a different location.');
      }
      if (!Array.isArray(geoData.results)) {
        throw new Error('The location service returned invalid data. Please try again later.');
      }

      const place = geoData.results[0];
      if (
        !place ||
        typeof place.name !== 'string' ||
        !Number.isFinite(place.latitude) ||
        !Number.isFinite(place.longitude)
      ) {
        throw new Error('The location service returned invalid location data. Please try again.');
      }

      const forecastData = await fetchJson(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`,
        'The weather service'
      );
      const current = forecastData?.current;
      const daily = forecastData?.daily;
      const hasCurrentWeather =
        Number.isFinite(current?.temperature_2m) &&
        Number.isFinite(current?.weather_code) &&
        Number.isFinite(current?.wind_speed_10m);
      const hasSevenDayForecast =
        Array.isArray(daily?.time) &&
        Array.isArray(daily?.weather_code) &&
        Array.isArray(daily?.temperature_2m_max) &&
        Array.isArray(daily?.temperature_2m_min) &&
        daily.time.length === 7 &&
        daily.weather_code.length === 7 &&
        daily.temperature_2m_max.length === 7 &&
        daily.temperature_2m_min.length === 7 &&
        daily.time.every((date) => !Number.isNaN(Date.parse(`${date}T12:00:00`))) &&
        daily.weather_code.every(Number.isFinite) &&
        daily.temperature_2m_max.every(Number.isFinite) &&
        daily.temperature_2m_min.every(Number.isFinite);

      if (!hasCurrentWeather || !hasSevenDayForecast) {
        throw new Error('The weather service returned an incomplete forecast. Please try again later.');
      }

      setWeather({
        city: place.name,
        country: place.country,
        current,
        daily,
        recommendation: getRecommendation(
          current.temperature_2m,
          current.weather_code
        ),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while fetching weather.'
      );
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather('Chennai');
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!city.trim()) {
      setError('Please enter a city name.');
      return;
    }
    fetchWeather(city.trim());
  };

  return (
    <div className="app-shell">
      <div className="card">
        <h1>Weather Intelligence</h1>

        <form onSubmit={handleSubmit} className="search-row">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Search city"
            aria-label="City"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Search'}
          </button>
        </form>

        {error && <div className="error-box" role="alert">{error}</div>}
        {loading && <p className="loading-message" role="status">Getting the latest forecast...</p>}

        {weather && (
          <>
            <div className="header">
              <div>
                <p className="label">Location</p>
                <h2>{weather.city}, {weather.country}</h2>
              </div>
              <div className="temp-box">
                {Math.round(weather.current.temperature_2m)}°C
              </div>
            </div>
            <p className="updated-note">
              Current conditions
              {weather.current.time && ` · ${weather.current.time.slice(11, 16)} local time`}
            </p>

            <div className="info-grid">
              <div>
                <p className="label">Condition</p>
                <strong>{weatherCodeMap[weather.current.weather_code] || 'Unknown'}</strong>
              </div>
              <div>
                <p className="label">Wind</p>
                <strong>{Math.round(weather.current.wind_speed_10m)} km/h</strong>
              </div>
            </div>

            <div className="recommendation">
              <span>Recommendation</span>
              <p>{weather.recommendation}</p>
            </div>

            <ForecastChart daily={weather.daily} />

            <section className="forecast-section" aria-labelledby="forecast-heading">
              <h3 id="forecast-heading">7-day forecast</h3>
            <div className="forecast">
              {weather.daily.time.map((day, index) => (
                <div key={day} className="forecast-card">
                  <p>{new Date(`${day}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <small>{weatherCodeMap[weather.daily.weather_code[index]] || 'Unknown'}</small>
                  <strong>{Math.round(weather.daily.temperature_2m_max[index])}° / {Math.round(weather.daily.temperature_2m_min[index])}°</strong>
                </div>
              ))}
            </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
