import mongoose from "mongoose";

export const connectDB = async () => {

    return await mongoose
        .connect(process.env.DB_CONNECTION_URL)
        .then((res) => { console.log("Connection has been established successfully"); })
        .catch((err) => { console.log(err); })
}