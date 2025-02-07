import axios from 'axios';
import 'dotenv/config';
import { WeatherResponse } from './types.js';
import { createClient } from 'redis';
import OpenAI from "openai";

export class WeatherSDK {
    private static URL:string = 'https://api.openweathermap.org/data/2.5/weather'
    private static HourlyURL:string = 'https://api.openweathermap.org/data/2.5/forecast'
    private redisClient = createClient({
        url: process.env.REDIS_URL
      });   

    constructor(private api_key:string){
        const openai = new OpenAI({
            baseURL: 'https://api.deepseek.com',
            apiKey: process.env.DEEP_WEATHER
        });
        this.redisClient.on('error', (error) => {
            console.error(error)
        })

        this.redisClient.on('connect', () => { 
            console.log('Connected to Redis Server')
        })

        this.redisClient.connect().then(() =>(
            console.log('Succesfully Connected')
        ))
    }
    
    async fetchCity(city:string):Promise<any | object>{ 
        return await axios.get(
            'http://api.openweathermap.org/geo/1.0/direct',
                { params:{
                    q:city,
                    limit:1,
                    appid:this.api_key
                }}
            )
    }

    CacheKeyMiddleWare(city:string):string{
        return `weather_${city.trim().replace(' ', '_').toLowerCase()}`
    }
    async getCurrentWeatherByLocation(city:string) : Promise<WeatherResponse | string> {
        try
            {                  
                const cacheKey: string = this.CacheKeyMiddleWare(city);
                const cachedData =await this.redisClient.get(cacheKey);
                if(!cachedData){
                    const findCountryCoordinates  = await this.fetchCity(city)
                    if (!findCountryCoordinates.data || findCountryCoordinates.data.length === 0){
                        throw new Error('Please Enter a Correct Country Name!')
                    }
                    const data = await axios.get(WeatherSDK.URL, {
                        params:{
                            lat:findCountryCoordinates.data[0].lat,
                            lon:findCountryCoordinates.data[0].lon,
                            appid:this.api_key
                        }
                    })
                    await this.redisClient.set(cacheKey, JSON.stringify(data.data));
                    return data.data;
                }
                return cachedData;
                
            }
            catch (error) {
                return 'Error fetching weather data';
        }
    }


    getWeatherForecast(city: string){
        try
            {
                return this.fetchCity(city)
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


    async getForcast(city: string,days:number){
        const forcastURL = 'http://api.weatherapi.com/v1/forecast.json'


        const onCall = await axios.get(
            forcastURL,
                { params:{
                    key:'6de7e941a5df45f18e3135757250702',
                    q:city,
                    days:days,
                    api:'no',
                    alerts:'no'
                }}
            )
        return onCall.data;
    }



     async getLocation(): Promise<{ lat: number; lon: number }> {
        try
        {
        const response = await axios.get("http://ip-api.com/json/");
        const data = await axios.get(WeatherSDK.URL, {
            params:{
                lat:response.data.lat,
                lon:response.data.lon,
                appid:this.api_key
            }
        })
            return data.data
        } 
        catch (error) {
            throw new Error("Unable to fetch location");
        }
    }
}



