
import connectDB from "./db/index.js";
import dotenv from "dotenv"
import {app} from './app.js'


dotenv.config({
    path: './.env'
})



connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`server is running on port ${process.env.PORT}`);
    
    
    })
    app.on('error', (err) => {
                console.error('error', err);
                throw err;
                
            })
})
.catch((err) => {
    console.log("MONGO db connection failed !!!", err);
})



















// import express from "express";

// const app = express();
// (async() => {
//     try {
//         await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
//         app.on('error', (err) => {
//             console.error('error', err);
//             throw err;
            
//         })

        

//         app.listen(process.env.PORT, () => {
//             console.log(`server is running on port ${process.env.PORT}`);
//         })

        
//     } catch (error) {
//         console.log(error);

        
//     }
// })()