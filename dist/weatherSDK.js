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
import { createClient } from 'redis';
export class WeatherSDK {
    constructor(api_key) {
        this.api_key = api_key;
        this.redisClient = createClient({
            url: 'redis://default:BfRMGtpyUzLi6Krp45cMw0VhUmgJAUSo@redis-14945.c84.us-east-1-2.ec2.redns.redis-cloud.com:14945'
        });
        this.WeatherCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
        this.redisClient.on('error', (error) => {
            console.error(error);
        });
        this.redisClient.on('connect', () => {
            console.log('Connected to Redis Server');
        });
        this.redisClient.connect().then(() => (console.log('Succesfully Connected')));
    }
    CacheKeyMiddleWare(city) {
        return `weather_${city.trim().replace(' ', '_').toLowerCase()}`;
    }
    getCurrentWeatherByLocation(city) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cacheKey = this.CacheKeyMiddleWare(city);
                const cachedData = yield this.redisClient.get(cacheKey);
                console.log(yield this.redisClient.get(cacheKey));
                if (!cachedData) {
                    const findCountryCoordinates = yield axios.get('http://api.openweathermap.org/geo/1.0/direct', { params: {
                            q: city,
                            limit: 1,
                            appid: this.api_key
                        } });
                    if (!findCountryCoordinates.data || findCountryCoordinates.data.length === 0) {
                        throw new Error('Please Enter a Correct Country Name!');
                    }
                    const data = yield axios.get(WeatherSDK.URL, {
                        params: {
                            lat: findCountryCoordinates.data[0].lat,
                            lon: findCountryCoordinates.data[0].lon,
                            appid: this.api_key
                        }
                    });
                    yield this.redisClient.set(cacheKey, JSON.stringify(data.data));
                    console.log('Data from API');
                    console.log(data.data);
                    return data.data;
                }
                console.log('Data from Cache');
                console.log(cachedData);
                return cachedData;
            }
            catch (error) {
                console.error(error);
                return 'Error fetching weather data';
            }
        });
    }
    getWeatherForecast(city) {
        try {
            return axios.get('http://api.openweathermap.org/geo/1.0/direct', { params: {
                    q: city,
                    limit: 1,
                    appid: this.api_key
                } })
                .then((response) => {
                if (!response) {
                    throw new Error('Please Enter the Correct Country Name');
                }
                const { lat, lon } = response.data[0];
                return axios.get(WeatherSDK.HourlyURL, {
                    params: {
                        lat: lat,
                        lon: lon,
                        appid: this.api_key
                    }
                });
            })
                .then((weatherResponse) => {
                return weatherResponse.data;
            });
        }
        catch (error) {
            return 'Failed to Fetch Weather Date, Please Try Again Later!';
        }
    }
}
WeatherSDK.URL = 'https://api.openweathermap.org/data/2.5/weather';
WeatherSDK.HourlyURL = 'https://api.openweathermap.org/data/2.5/forecast';
