const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect('mongodb+srv://admin:b43b6o2o4@cluster0.bqiuehl.mongodb.net/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = {
  name: {required: true, type: String}
};
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


const Item = mongoose.model("Item", itemsSchema);

app.get("/", function(req, res) {
  Item.find().then(foundItems => {
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}).then(foundList => {
    if(foundList){
      // มี List ที่ชื่อ customListName อยู่ในฐานข้อมูลแล้ว
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }else{
      // ยังไม่มี List ที่ชื่อ customListName อยู่ในฐานข้อมูล
      const list = new List({
        name: customListName,
        items: []
      });
      list.save().then(() => {
        res.redirect("/"+customListName);
      });
    }
  });

});


app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  if (!itemName) {
    res.redirect("/" + listName);
    return;
  }
  if(listName === "Today"){
    const item = new Item({
      name: itemName
    });
    console.log(item.name+" added");
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}).then(foundList => {
      foundList.items.push({name: itemName});
      foundList.save();
      res.redirect("/"+listName);
    });
  }
});

app.post("/delete", function(req, res){
  const itemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today"){
    Item.findByIdAndRemove(itemId).then((deletedItem) => {
      console.log(deletedItem.name, "deleted"); 
      res.redirect("/");
    }).catch(err => {
      console.log("Error deleting item:", err);
      res.redirect("/");
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}}).then(foundList => {
      res.redirect("/"+listName);
    });
  }
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
