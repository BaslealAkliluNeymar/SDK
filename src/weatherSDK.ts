import axios, { AxiosResponse } from 'axios';
import 'dotenv/config';
import NodeCache from 'node-cache';
import { WeatherResponse } from './types.js';
export class WeatherSDK {
    private static URL:string = 'https://api.openweathermap.org/data/2.5/weather'
    private static HourlyURL:string = 'https://api.openweathermap.org/data/2.5/forecast'
    private WeatherCache:NodeCache;
    constructor(private api_key:string){
        this.WeatherCache = new NodeCache({stdTTL:600})
    }
    
    async getCurrentWeatherByLocation(city: string): Promise<WeatherResponse | string> {
        try {  
            const cacheKey = `weather_${city.replace(' ', "_").toLowerCase()}`;
            console.log(`Cache Key: ${cacheKey}`);
    
            // Check cache
            const cachedData = this.WeatherCache.get(cacheKey);
            if (cachedData) {
                console.log('Data from Cache');
                console.log(cachedData);
                return cachedData as WeatherResponse;
            }
    
            // Fetch coordinates
            const findCountryCoordinates = await axios.get(
                'http://api.openweathermap.org/geo/1.0/direct',
                {
                    params: { q: city, limit: 1, appid: this.api_key }
                }
            );
    
            if (!findCountryCoordinates.data.length) {
                throw new Error('Please Enter a Correct City Name!');
            }
    
            // Fetch weather data
            const { lat, lon } = findCountryCoordinates.data[0];
            const data = await axios.get(WeatherSDK.URL, {
                params: { lat, lon, appid: this.api_key }
            });
    
            // Cache data for 10 minutes
            this.WeatherCache.set(cacheKey, data.data, 600);
            console.log(`Cached weather data for ${city}`);
    
            return data.data;
        } catch (error) {
            console.error('Error:', error);
            return 'Failed to Fetch Weather Data, Please Try Again Later!';
        }
    }
    


    getWeatherForecast(city: string){
        try
            {
                return axios.get(
                    'http://api.openweathermap.org/geo/1.0/direct',
                       { params:{
                            q:city,
                            limit:1,
                            appid:this.api_key
                        }}
                    )
                    .then((response) => {
                        if(!response){
                            throw new Error('Please Enter the Correct Country Name')
                        }
                        const { lat , lon } = response.data[0]
                        
                       return axios.get(WeatherSDK.HourlyURL, {
                            params:{
                                lat:lat,
                                lon:lon,
                                appid:this.api_key
                            }
                        })  
                        
                    })
                    .then((weatherResponse) => {
                        return weatherResponse.data
                    })
            } 
            catch (error) {
                  return 'Failed to Fetch Weather Date, Please Try Again Later!';
        }
    }

}



