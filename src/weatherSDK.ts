import axios, { AxiosResponse } from 'axios';
import fs from 'fs'
import path from 'path'
import 'dotenv/config';
import NodeCache from 'node-cache';
import { WeatherResponse,cacheData } from './types.js';
export class WeatherSDK {
    private static URL:string = 'https://api.openweathermap.org/data/2.5/weather'
    private static HourlyURL:string = 'https://api.openweathermap.org/data/2.5/forecast'
    private WeatherCache:NodeCache;
    private cacheFilePath:string;
    private WeatherMap:Map<string, WeatherResponse> = new Map();
    constructor(private api_key:string){
        this.WeatherCache = new NodeCache({ stdTTL:600 })
        this.cacheFilePath = path.resolve("./src", 'cache.json')
    }
    

    CacheKeyMiddleWare(city:string):string{
        return `weather_${city.trim().replace(' ', '_').toLowerCase()}`
    }
    async getCurrentWeatherByLocation(city:string) : Promise<WeatherResponse | string> {
        try
            {  
                fs.readFile(this.cacheFilePath, 'utf8', (err, data) => {
                    if(err){
                        console.log('There was an error reading file!')
                    }
                    else{
                        console.log(`Read from file${JSON.parse(data)}`)
                    }
                })
                const cacheKey: string = this.CacheKeyMiddleWare(city);
                const cachedData: any = this.WeatherCache.get(city);
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


                    this.WeatherCache.set(cacheKey, data.data, 600);

                    fs.writeFile('./cache.json', JSON.stringify(
                        Object.fromEntries(this.WeatherMap.set(`${cacheKey}`,data.data))
                    ), (err) => {
                        if(err){
                            console.log('There was an error writing to file!')
                        }
                    })
                    return data.data;
                }
                else{
                    console.log('Data from Cache');
                    return cachedData;
                }
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



