import { WeatherSDK } from './weatherSDK.js';
const weatherSDK = new WeatherSDK(process.env.API_KEY || '');
const connect = weatherSDK.getRecommendations();
connect.then((data) => {
    console.log(data);
}).catch((error) => {
    console.error(error);
});
