import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import { AppDataSource } from "./config/db.js";
import formRouter from "./src/routes/form.routes.js";
import cors from "cors";
import { errorHandler } from "./utils/errorHandler.js";
import routes from "./src/routes/index.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";


const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));
dotenv.config();


app.use(
  cors({
    origin: [process.env.FRONTEND_URL], // Add all allowed origins
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // ✅ Allow cookies/credentials
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev"));

const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => {
  return res.send("<h1> server is up and runnig fine</h1>");
});

app.use(`/api/v1/form`, formRouter);
app.use("/api", routes);

// app.use(errorHandler())

app.listen(PORT, async () => {
  // await run();
  await AppDataSource.initialize()
    .then(() => console.log("✅ Oracle DB connected & users table created"))
    .catch((err) => console.error("❌ DB connection error:", err));

  console.log("server started on", PORT);
});
