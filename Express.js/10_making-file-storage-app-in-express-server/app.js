import express from "express";
import { readdir } from "fs/promises";

const app = express();



app.listen(4000, () => {
  console.log(`Server Started`);
});
