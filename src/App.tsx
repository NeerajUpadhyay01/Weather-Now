import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Location {
  name: string;
  admin1: string;
  latitude: number;
  longitude: number;
}

interface WeatherData {
  current: {
    temperature_2m: number;
    is_day: number;
    rain: number;
    showers: number;
    snowfall: number;
    weather_code: number;
    cloud_cover: number;
    wind_speed_10m: number;
  };
}

interface WeatherCodes {
  [key: number]: string;
}

interface GeocodingResponse {
  results?: Location[];
}

const App: React.FC = () => {
  const [location, setLocation] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );

  const getWeatherDescription = (code: number): string => {
    const weatherCodes: WeatherCodes = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
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
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail',
    };
    return weatherCodes[code] || 'Unknown weather condition';
  };

  const getWeatherIcon = (code: number, isDay: number): JSX.Element => {
    if (code === 0)
      return isDay ? (
        <img src="./sun.webp" alt="sunny" />
      ) : (
        <img src="./night.webp" alt="night" />
      );
    if (code === 1)
      return isDay ? (
        <img src="./cloudy-day.webp" alt="cloudy day" />
      ) : (
        <img src="./cloud.webp" alt="cloudy" />
      );
    if (code === 2)
      return isDay ? (
        <img src="./cloudy-day.webp" alt="cloudy day" />
      ) : (
        <img src="./cloud.webp" alt="cloudy" />
      );
    if (code === 3) return <img src="./cloud.webp" alt="cloudy" />;
    if (code === 45 || code === 48) return <img src="./fog.webp" alt="foggy" />;
    if (code >= 51 && code <= 55) return <img src="./rain.webp" alt="rain" />;
    if (code === 56 || code === 57) return <img src="./snow.webp" alt="snow" />;
    if (code >= 61 && code <= 65) return <img src="./rain.webp" alt="rain" />;
    if (code === 66 || code === 67) return <img src="./snow.webp" alt="snow" />;
    if (code >= 71 && code <= 77) return <img src="./snow.webp" alt="snow" />;
    if (code >= 80 && code <= 82) return <img src="./rain.webp" alt="rain" />;
    if (code === 85 || code === 86) return <img src="./snow.webp" alt="snow" />;
    if (code >= 95) return <img src="./storm.webp" alt="storm" />;
    return <img src="./question.webp" alt="unknown weather" />;
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (location.length >= 2) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [location]);

  const fetchSuggestions = async (): Promise<void> => {
    try {
      const response = await axios.get<GeocodingResponse>(
        `https://geocoding-api.open-meteo.com/v1/search?name=${location}&count=10&language=en&format=json`
      );
      setSuggestions(response.data.results || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const fetchWeather = async (lat: number, long: number): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await axios.get<WeatherData>(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m,is_day,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m&timezone=auto`
      );
      setWeatherData(response.data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (suggestion: Location): void => {
    setSelectedLocation(suggestion);
    setLocation('');
    setSuggestions([]);
    fetchWeather(suggestion.latitude, suggestion.longitude);
  };

  return (
    <div className="weather-container">
      <div className="weather-card">
        <div className="search-container">
          <input
            type="text"
            value={location}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setLocation(e.target.value)
            }
            placeholder="Enter location..."
            className="search-input"
          />

          {suggestions.length > 0 && (
            <div className="suggestions-container">
              {suggestions.map((suggestion) => (
                <div
                  key={`${suggestion.latitude}-${suggestion.longitude}`}
                  onClick={() => handleLocationSelect(suggestion)}
                  className="suggestion-item"
                >
                  {suggestion.name}, {suggestion.admin1}
                </div>
              ))}
            </div>
          )}
        </div>

        {isLoading && <div className="loading">Loading...</div>}

        {weatherData && (
          <div className="weather-info">
            <div className="weather-detail">
              <div>
                {getWeatherIcon(
                  weatherData.current.weather_code,
                  weatherData.current.is_day
                )}
              </div>
              <h1>{weatherData.current.temperature_2m} °C</h1>
              <p>{getWeatherDescription(weatherData.current.weather_code)}</p>
            </div>
            <div className="weather-detail wind-detail">
              <img id="wind" src="./wind.webp" alt="wind speed" />
              <p>{weatherData.current.wind_speed_10m} km/h</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
