const expess = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = expess();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(expess.static("public"));

mongoose.connect("mongodb+srv://admin-bijay:bijay123@cluster0.xuiiidm.mongodb.net/todolistDB");

const itemSchema = {
    name: String
}

const Item = mongoose.model("Item", itemSchema);

const Item1 = new Item({
    name: "Welcome to your todolist!"
});

const Item2 = new Item({
    name: "Hit the + button to add a new item"
});

const Item3 = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [Item1, Item2, Item3];

const listSchema = {
    name: String,
    items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get('/', function(req, res){

    const day = date.getDate();

    Item.find({}).then((foundItems) => {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems)
            .then(() => {
                console.log("Succesfully saved default items to DB.");
            })
            .catch((err) => {
                console.log(err);
            });
            res.redirect('/');
        } else {
            res.render('list', {titleHead: "Productive Your Day", listTitle: day, newListItem: foundItems});
        }
    });
});

app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}).then((foundList) => {
        if(!foundList){
            // Create a new list
            const list = new List({
                name: customListName,
                items: defaultItems
            });
        
            list.save();

            res.redirect('/' + customListName);

        } else {
            // Show an existing list
            res.render('list', {titleHead: customListName, listTitle: foundList.name, newListItem: foundList.items});
        }
    });
});

app.post('/', function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const day = date.getDate();

    const item = new Item({
        name: itemName
    });

    if(listName === day) {
        item.save();
        res.redirect('/');
    } else {
        List.findOne({name: listName}).then((foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect('/' + listName);
        });
    }
});

app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    const day = date.getDate();

    if(listName === day){
        Item.findByIdAndRemove(checkedItemId).then(() => {
            console.log("Successfully deleted checked item.");
            res.redirect('/');
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(() => {
            res.redirect('/' + listName);
        });
    }
});

app.get('/about', function(req, res){
    res.render('about',{titleHead: "About"});
});

let port = process.env.PORT;
if(port == null || port == ""){
    port = 3000;
}

app.listen(port, function(){
    console.log("Server has started successfully.");
});