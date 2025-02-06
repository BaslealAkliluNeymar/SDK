var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from 'axios';
import 'dotenv/config';
import NodeCache from 'node-cache';
export class WeatherSDK {
    constructor(api_key) {
        this.api_key = api_key;
        this.WeatherCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
    }
    getCacheKey(city, suffix = '') {
        return `weather_${city.trim().replace(/\s+/g, '_').toLowerCase()}${suffix}`;
    }
    getCurrentWeatherByLocation(city) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = this.getCacheKey(city);
            const cachedData = this.WeatherCache.get(cacheKey);
            if (cachedData) {
                console.log('Data from Cache');
                return { data: cachedData, source: 'cache' };
            }
            try {
                const geoResponse = yield axios.get('http://api.openweathermap.org/geo/1.0/direct', {
                    params: { q: city, limit: 1, appid: this.api_key }
                });
                if (!geoResponse.data || geoResponse.data.length === 0)
                    throw new Error('Please Enter a Correct Country Name!');
                const { lat, lon } = geoResponse.data[0];
                const weatherResponse = yield axios.get(WeatherSDK.URL, {
                    params: { lat, lon, appid: this.api_key }
                });
                const weatherData = weatherResponse.data;
                this.WeatherCache.set(cacheKey, weatherData);
                console.log('Data from API');
                return { data: weatherData, source: 'api' };
            }
            catch (error) {
                console.error(error);
                return 'Error fetching weather data';
            }
        });
    }
    getWeatherForecast(city) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = this.getCacheKey(city, '_forecast');
            const cachedData = this.WeatherCache.get(cacheKey);
            if (cachedData) {
                console.log('Data from Cache');
                return cachedData;
            }
            try {
                const geoResponse = yield axios.get('http://api.openweathermap.org/geo/1.0/direct', {
                    params: { q: city, limit: 1, appid: this.api_key }
                });
                if (!geoResponse.data || geoResponse.data.length === 0)
                    throw new Error('Please Enter the Correct Country Name');
                const { lat, lon } = geoResponse.data[0];
                const forecastResponse = yield axios.get(WeatherSDK.HourlyURL, {
                    params: { lat, lon, appid: this.api_key }
                });
                const forecastData = forecastResponse.data;
                this.WeatherCache.set(cacheKey, forecastData);
                console.log('Data from API');
                return forecastData;
            }
            catch (error) {
                console.error(error);
                return 'Failed to Fetch Weather Data, Please Try Again Later!';
            }
        });
    }
}
WeatherSDK.URL = 'https://api.openweathermap.org/data/2.5/weather';
WeatherSDK.HourlyURL = 'https://api.openweathermap.org/data/2.5/forecast';
