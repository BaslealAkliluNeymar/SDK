import axios from 'axios';
import 'dotenv/config';
import NodeCache from 'node-cache';
import { WeatherResponse } from './types.js';

export class WeatherSDK {
  private static URL = 'https://api.openweathermap.org/data/2.5/weather';
  private static HourlyURL = 'https://api.openweathermap.org/data/2.5/forecast';
  private WeatherCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

  constructor(private api_key: string) {}

  private getCacheKey(city: string, suffix = ''): string {
    return `weather_${city.trim().replace(/\s+/g, '_').toLowerCase()}${suffix}`;
  }

  async getCurrentWeatherByLocation(city: string): Promise<{ data: WeatherResponse; source: 'cache' | 'api' } | string> {
    const cacheKey = this.getCacheKey(city);
    const cachedData = this.WeatherCache.get<WeatherResponse>(cacheKey);
    if (cachedData) {
      console.log('Data from Cache');
      return { data: cachedData, source: 'cache' };
    }
  
    try {
      const geoResponse = await axios.get('http://api.openweathermap.org/geo/1.0/direct', {
        params: { q: city, limit: 1, appid: this.api_key }
      });
      if (!geoResponse.data || geoResponse.data.length === 0)
        throw new Error('Please Enter a Correct Country Name!');
  
      const { lat, lon } = geoResponse.data[0];
  
      const weatherResponse = await axios.get(WeatherSDK.URL, {
        params: { lat, lon, appid: this.api_key }
      });
  
      const weatherData = weatherResponse.data;
      this.WeatherCache.set(cacheKey, weatherData);
      console.log('Data from API');
      return { data: weatherData, source: 'api' };
    } catch (error) {
      console.error(error);
      return 'Error fetching weather data';
    }
  }
  

  async getWeatherForecast(city: string): Promise<WeatherResponse | string> {
    const cacheKey = this.getCacheKey(city, '_forecast');
    const cachedData = this.WeatherCache.get<WeatherResponse>(cacheKey);
    if (cachedData) {
      console.log('Data from Cache');
      return cachedData;
    }

    try {
      const geoResponse = await axios.get('http://api.openweathermap.org/geo/1.0/direct', {
        params: { q: city, limit: 1, appid: this.api_key }
      });

      if (!geoResponse.data || geoResponse.data.length === 0)
        throw new Error('Please Enter the Correct Country Name');

      const { lat, lon } = geoResponse.data[0];

      const forecastResponse = await axios.get(WeatherSDK.HourlyURL, {
        params: { lat, lon, appid: this.api_key }
      });

      const forecastData = forecastResponse.data;
      this.WeatherCache.set(cacheKey, forecastData);
      console.log('Data from API');
      return forecastData;
    } catch (error) {
      console.error(error);
      return 'Failed to Fetch Weather Data, Please Try Again Later!';
    }
  }
}
