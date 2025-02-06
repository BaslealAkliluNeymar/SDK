import axios from 'axios';
import 'dotenv/config';
import NodeCache from 'node-cache';
import { WeatherResponse } from './types.js';
import { createClient } from 'redis';
export class WeatherSDK {
    private static URL:string = 'https://api.openweathermap.org/data/2.5/weather'
    private static HourlyURL:string = 'https://api.openweathermap.org/data/2.5/forecast'
    private WeatherCache:NodeCache;
    private redisClient = createClient({
        url: process.env.REDIS_URL
      });   

    constructor(private api_key:string){
        this.WeatherCache = new NodeCache({ stdTTL:600,checkperiod:120}) 

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
    

    CacheKeyMiddleWare(city:string):string{
        return `weather_${city.trim().replace(' ', '_').toLowerCase()}`
    }
    async getCurrentWeatherByLocation(city:string) : Promise<WeatherResponse | string> {
        try
            {                  
                const cacheKey: string = this.CacheKeyMiddleWare(city);
               
                const cachedData =await this.redisClient.get(cacheKey);
                console.log(await this.redisClient.get(cacheKey))
                if(!cachedData){
                    const findCountryCoordinates  = await axios.get(
                        'http://api.openweathermap.org/geo/1.0/direct',
                            { params:{
                                q:city,
                                limit:1,
                                appid:this.api_key
                            }}
                        )


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
                    console.log('Data from API');
                    console.log(data.data)
                    return data.data;
                }
            
                console.log('Data from Cache');
                console.log(cachedData)
                return cachedData;
                
            }
            catch (error) {
                console.error(error);
                return 'Error fetching weather data';
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



