#!/usr/bin/env node
import 'dotenv/config';
// import axios from 'axios'; 
// import { Command } from 'commander';
import { Sequelize, DataTypes } from 'sequelize';
const sequelize = new Sequelize('Inventory', 'postgres', '1209', {
    dialect: 'postgres',
    host: 'localhost',
    port: 5432
});
const User = sequelize.define('user', {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    age: {
        type: DataTypes.INTEGER
    }
}, {
    freezeTableName: true,
    timestamps: false
});
User.sync({ force: true }).then(() => {
    const user = User.build({
        user_id: 1,
        user_name: 'bas',
        password: '1234',
        age: 25
    });
    console.log(user.user_name);
    // return user.save()
})
    .then(() => {
    console.log('User added to database');
})
    .catch(() => {
    console.log('Error creating table');
});
// const program = new Command()
// class WeatherSDK{  
//     private api_key:string
//     url:string
//     constructor(api_key:string){
//         this.api_key = api_key;
//         this.url = 'https://api.openweathermap.org/data/2.5/weather'
//     }
//     async getCurrentWeatherByLocation(lat:number, lon:number) {
//         try
//         {
//             const data = await axios.get(this.url, {
//                 params:{
//                     lat:lat,
//                     lon:lon,
//                     appid:this.api_key
//                 }
//             })
//             return data.data
//         } catch (error) {
//             return 'There was an error!';
//         }
//     }
//     async getCurrentWeatherByCity(city:string){
//         try{
//             const data = await axios.get(this.url, {
//                 params:{
//                    q:city,
//                    appid:this.api_key 
//                 }
//             })
//             return data.data
//         } catch (error) {
//             return 'There was an error!';
//         }
//     }
// }
// console.log(process.argv[2])
// program 
//     .command('weather')
//     .argument('<city>', 'City name')
//     .action(async (city:string) =>{
//         const SDK = new WeatherSDK(process.env.API_KEY as string)
//         const data  = await SDK.getCurrentWeatherByCity(city)
//         console.log(data)
//     })
// program.parse(process.argv);
