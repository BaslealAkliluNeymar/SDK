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
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import NodeCache from 'node-cache';
export class WeatherSDK {
    constructor(api_key) {
        this.api_key = api_key;
        this.WeatherMap = new Map();
        this.WeatherCache = new NodeCache({ stdTTL: 600 });
        this.cacheFilePath = path.resolve("./src", 'cache.json');
    }
    CacheKeyMiddleWare(city) {
        return `weather_${city.trim().replace(' ', '_').toLowerCase()}`;
    }
    getCurrentWeatherByLocation(city) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                fs.readFile(this.cacheFilePath, 'utf8', (err, data) => {
                    if (err) {
                        console.log('There was an error reading file!');
                    }
                    else {
                        console.log(`Read from file${JSON.parse(data)}`);
                    }
                });
                const cacheKey = this.CacheKeyMiddleWare(city);
                const cachedData = this.WeatherCache.get(city);
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
                    this.WeatherCache.set(cacheKey, data.data, 600);
                    fs.writeFile('./cache.json', JSON.stringify(Object.fromEntries(this.WeatherMap.set(`${cacheKey}`, data.data))), (err) => {
                        if (err) {
                            console.log('There was an error writing to file!');
                        }
                    });
                    return data.data;
                }
                else {
                    console.log('Data from Cache');
                    return cachedData;
                }
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
