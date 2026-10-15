import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// import connectDB from "./config/db.js";
// import userRoutes from "./routes/user.route.js";
import patientRoutes from "./routes/patientRoutes.js";
import whatsappRoutes from "./routes/whatsappRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// connectDB();

app.get("/", (req, res) => {
  res.json({
    message: "API is running"
  });
});



// app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/whatsapp", whatsappRoutes);



const PORT = process.env.PORT || 5008;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
