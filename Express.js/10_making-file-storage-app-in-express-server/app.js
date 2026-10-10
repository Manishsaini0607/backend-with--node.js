import express from "express";
import { readdir } from "fs/promises";
import {rm} from "fs/promises";

const app = express();


// Middleware to handle CORS
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  next();
});


// Middleware to handle file download
// app.use ((req, res, next) => {
//      if (req.query.action === "download") {
//          res.set("Content-Disposition", "attachment");
//      }

//    const setFuntion = express.static("storage");
//      setFuntion(req, res, next);
// });


 app.get("/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = `${import.meta.dirname}/storage/${filename}`;
     if (req.query.action === "download") {
         res.set("Content-Disposition", "attachment");
     }
   res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send("File not found");
        }})
});

 app.delete("/:filename", async (req, res) => {
    const filename = req.params.filename;
     console.log(`Deleting file: ${filename}`);
    const filePath = `${import.meta.dirname}/storage/${filename}`;
     try {
        await rm(filePath);
        res.status(200).send("File deleted successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting file");
    }

});

// Route to get the list of files in the storage directory
app.get("/", async (req, res) => {
    const files = await readdir("./storage");
    console.log(files);
    res.json(files);
});



app.listen(4000, () => {
  console.log(`Server Started`);
});
