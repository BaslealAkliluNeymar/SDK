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
import { createClient } from 'redis';
import OpenAI from "openai";
export class WeatherSDK {
    constructor(api_key) {
        this.api_key = api_key;
        this.redisClient = createClient({
            url: process.env.REDIS_URL
        });
        const openai = new OpenAI({
            baseURL: 'https://api.deepseek.com',
            apiKey: process.env.DEEP_WEATHER
        });
        this.redisClient.on('error', (error) => {
            console.error(error);
        });
        this.redisClient.on('connect', () => {
            console.log('Connected to Redis Server');
        });
        this.redisClient.connect().then(() => (console.log('Succesfully Connected')));
    }
    fetchCity(city) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield axios.get('http://api.openweathermap.org/geo/1.0/direct', { params: {
                    q: city,
                    limit: 1,
                    appid: this.api_key
                } });
        });
    }
    CacheKeyMiddleWare(city) {
        return `weather_${city.trim().replace(' ', '_').toLowerCase()}`;
    }
    getCurrentWeatherByLocation(city) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cacheKey = this.CacheKeyMiddleWare(city);
                const cachedData = yield this.redisClient.get(cacheKey);
                if (!cachedData) {
                    const findCountryCoordinates = yield this.fetchCity(city);
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
                    return data.data;
                }
                return cachedData;
            }
            catch (error) {
                return 'Error fetching weather data';
            }
        });
    }
    getWeatherForecast(city) {
        try {
            return this.fetchCity(city)
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
    getForcast(city, days) {
        return __awaiter(this, void 0, void 0, function* () {
            const forcastURL = 'http://api.weatherapi.com/v1/forecast.json';
            const onCall = yield axios.get(forcastURL, { params: {
                    key: '6de7e941a5df45f18e3135757250702',
                    q: city,
                    days: days,
                    api: 'no',
                    alerts: 'no'
                } });
            return onCall.data;
        });
    }
    getLocation() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios.get("http://ip-api.com/json/");
                const data = yield axios.get(WeatherSDK.URL, {
                    params: {
                        lat: response.data.lat,
                        lon: response.data.lon,
                        appid: this.api_key
                    }
                });
                return data.data;
            }
            catch (error) {
                throw new Error("Unable to fetch location");
            }
        });
    }
    getRecommendations() {
        return __awaiter(this, void 0, void 0, function* () {
            const completion = yield OpenAI.Chat.Completions.caller({
                messages: [{ role: "system", content: "You are a helpful assistant." }],
                model: "deepseek-chat",
            });
            console.log(completion.choices[0].message.content);
        });
    }
}
WeatherSDK.URL = 'https://api.openweathermap.org/data/2.5/weather';
WeatherSDK.HourlyURL = 'https://api.openweathermap.org/data/2.5/forecast';
