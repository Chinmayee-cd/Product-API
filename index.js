var express = require("express");
const app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
const path = require("path");
app.set("view engine", "ejs");
app.use(express.static("."));

const Schema = mongoose.Schema;

const productSchema = new Schema({
  product_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  featured: { type: Boolean, default: true },
  rating: { type: Number },
  created_at: { type: Date, required: true },
  company: { type: String, required: true },
});

const prod_model = mongoose.model("products", productSchema);

mongoose.connect("mongodb://localhost:27017/api_project", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

var db = mongoose.connection;
db.on("error", () => console.log("Error in connecting to the database"));
db.once("open", () => console.log("Connected to the database"));

app.use(express.static(path.join(__dirname, "/")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app
  .get("/", (req, res) => {
    res.set({ "Access-Control-Allow-Origin": "*" });
    return res.sendFile(path.join(__dirname, "/", "index.html"));
  })
  .listen(3000);
app.post("/sign_up", (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  var repeat_pass = req.body.repeat_pass;
  var email = req.body.email;
  var data = {
    username: username,
    password: password,
    email: email,
  };
  db.collection("users").insertOne(data, (err, collection) => {
    if (err) {
      throw err;
    }
    console.log("Record Inserted Successfully");
  });
  return res.redirect("./index.html");
});
app.post("/sign_in", async (req, res) => {
  try {
    const user = await db
      .collection("products")
      .findOne({ username: req.body.sign_user });
    console.log(user);
    if (user) {
      const result = req.body.sign_pass === user.password;
      if (result) {
        res.redirect("./index.html");
      } else {
        res.redirect("./login.html?invalid_pwd=true");
      }
    } else {
      res.redirect("./login.html?invalid_user=true");
    }
  } catch {
    res.send("wrong details");
  }
});

app.post("/product_add", (req, res) => {
  var product_id = req.body.product_id;
  var name = req.body.name;
  var price = req.body.price;
  var featured = req.body.featured;
  var rating = req.body.rating;
  var created_at = req.body.created_at;
  var company = req.body.company;

  var data = {
    product_id: product_id,
    name: name,
    price: price,
    featured: featured,
    rating: rating,
    created_at: created_at,
    company: company,
  };
  db.collection("products").insertOne(data, (err, collection) => {
    if (err) {
      throw err;
    }
    console.log("Record Inserted Successfully");
  });
  res.redirect("/products");
});
app.get("/product_add", async (req, res) => {
  res.set({
    "Allow-Control-Allow-Origin": "*",
  });
  res.redirect("index.html");
});
app.get("/products", async (req, res) => {
  try {
    const products = await prod_model.find({});
    console.log(products);
    res.render("products", { products: products });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});
app.put("/product", async (req, res) => {
  const { product_id, field, val } = req.body;
  try {
    const update = {};
    update[field] = val;
    await prod_model.updateOne({ product_id: product_id }, { $set: update });
    res.send("Product updated successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating product");
  }
});

app.post("/delete_prod", async (req, res) => {
  const product_id = req.body.product_id;
  console.log(product_id);

  const result = await db
    .collection("products")
    .deleteOne({ product_id: product_id });
  res.send("Product deleted successfully");
});

app.get("/fetch_featured", async (req, res) => {
  try {
    const featuredProducts = await db
      .collection("products")
      .find({ featured: "true" })
      .toArray(function (err, result) {
        if (err) throw err;
        console.log(result);
      });
    if (!featuredProducts) {
      return res.status(404).json({ error: "Featured products not found" });
    }
    res.json(featuredProducts);
    console.log(featuredProducts);
  } catch (err) {
    console.error("Error fetching featured products:", err);
    res.status(500).send("Error fetching featured products");
  }
});

app.post("/fetch_with_price_criteria", async (req, res) => {
  val = req.body.price;
  try {
    console.log(val);
    const featuredProducts = await db
      .collection("products")
      .find({ price: { $lt: `$val` } })
      .toArray(function (err, result) {
        if (err) throw err;
        console.log(result);
      });
    if (!featuredProducts) {
      return res.status(404).json({ error: "No such products" });
    }
    res.json(featuredProducts);
    console.log(featuredProducts);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Error fetching products");
  }
});

app.post("/fetch_with_rating_criteria", async (req, res) => {
  val = req.body.rating;
  try {
    console.log(val);
    const featuredProducts = await db
      .collection("products")
      .find({ price: { $gt: `$val` } })
      .toArray(function (err, result) {
        if (err) throw err;
        console.log(result);
      });
    if (!featuredProducts) {
      return res.status(404).json({ error: "No such products" });
    }
    res.json(featuredProducts);
    console.log(featuredProducts);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Error fetching products");
  }
});
