import express from "express";
import dotenv from "dotenv"

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5001;

app.get("/",(reg,res) => {
    res.send("The server is working")
});

console.log("my port:", process.env.PORT)

app.listen(PORT,() =>{
    console.log("The server is running on PORT:", PORT)
});



//DATABASE

//