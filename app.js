import express, { query } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "node:fs/promises";

const app = express();

const port = 3000;

app.use(bodyParser.json());
app.use(express.static("public"));

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  next();
});

app.get("/itemCatergoryList", async (req, res) => {
  const itemsFile = await fs.readFile("./data/items.json");
  let items = JSON.parse(itemsFile);
  res.json({ result: items });
});

app.post("/itemCatergoryList", async (req, res) => {
  const { category } = req.body;

  const itemsFile = await fs.readFile("./data/items.json");
  let items = JSON.parse(itemsFile);
  if (category) {
    items = items.filter((i) => i.catergory === category);
  }
  res.json({ result: items });
});

app.post("/itemsdisplaylist", async (req, res) => {
  const { data } = req.body;
  const itemsFile = await fs.readFile("./data/itemsdetails.json");
  let items = JSON.parse(itemsFile);

  if (data) {
    const hasFilters =
      data.priceRangeMin !== "" ||
      data.priceRangeMax !== "" ||
      (Array.isArray(data.categories) && data.categories.length > 0) ||
      (data.rating !== null && data.rating !== undefined && data.rating !== "");

    if (hasFilters) {
      const filters = {
        inStock: (item) => {
          const result = !data.inStock || item.inStock === true;
          return result;
        },
        rating: (item) => {
          if (
            data.rating === null ||
            data.rating === undefined ||
            data.rating === ""
          ) {
            return true;
          }
          const itemRate = parseFloat(item.rate);
          const filterRating = parseFloat(data.rating);
          const result =
            !isNaN(itemRate) &&
            !isNaN(filterRating) &&
            itemRate >= filterRating;
          return result;
        },
        categories: (item) => {
          const result =
            !data.categories ||
            data.categories.length === 0 ||
            data.categories.includes(item.catergory);
          return result;
        },
        priceRange: (item) => {
          if (!data.priceRangeMin && !data.priceRangeMax) return true;
          const price = parseFloat(item.price);
          const min = data.priceRangeMin
            ? parseFloat(data.priceRangeMin)
            : -Infinity;
          const max = data.priceRangeMax
            ? parseFloat(data.priceRangeMax)
            : Infinity;
          const result = price >= min && price <= max;
          return result;
        },
      };

      items = items.filter((item) => {
        const filterResults = Object.entries(filters).map(([filterName, filterFn]) => {
          const result = filterFn(item);
          return result;
        });
        const overallResult = filterResults.every(Boolean);
        return overallResult;
      });
    }
  }

  if (items.length === 0) {
    res.json({ result: [], message: "No items found" });
  } else {
    res.json({ result: items });
  }
});

app.post("/itemsdetail", async (req, res) => {
  const { id } = req.body;
  const itemsFile = await fs.readFile("./data/itemsdetails.json");
  let items = JSON.parse(itemsFile);
  if (id) {
    items = items.filter((i) => Number(i.id) === Number(id));
  }
  if (items.length === 0) {
    res.json({ result: [], message: "No items found" });
  } else {
    res.json({ result: items });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
