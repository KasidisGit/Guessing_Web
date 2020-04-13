
var express = require("express");
var app = express();
var port = 3000;
var mongoose = require("mongoose");

app.set('view engine', 'ejs');

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/node-demo",
{ useNewUrlParser: true , useUnifiedTopology: true },() => console.log('connected to db'));

var QuestionSchema = new mongoose.Schema({
  category : String,
  questionName: String,
  score: { type: Number, default: 1000 },
  wrong_num : { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  passed: { type: Boolean , default : false }}, {
  versionKey: false }
);

var Question = mongoose.model("Question", QuestionSchema);

app.post("/start", async (req, res) => {
      console.log(req.body);
      var Q = new Question(req.body);    
      Q.save(function(err){
      if (err) { res.send('error');}
      else{
      Question.find({}).sort({date:-1}).limit(1).lean().exec().then(
      (data) => res.render('game-started', {
      cur_question : data[0].questionName,
      wrong_num : data[0].wrong_num,
      category :data[0].category,
      score : data[0].score
      })
      );
    }});  
});

app.post("/check", async (req, res) =>{
      var ans = req.body
      await Question.findOne(ans, function(err, arr){
      if (err) { throw(err);}
      if (arr == null){
        Question.findOne({passed: false}, function (err , d){
        d.score -= 100;
        d.wrong_num += 1;
        d.save()
        console.log(d)
      });
      Question.find({}).sort({date:-1}).limit(1).lean().exec().then(
      (data) => { res.render('game-started', 
      {
          cur_question : data[0].questionName, 
          wrong_num : data[0].wrong_num+1,
          category :data[0].category,
          passed: data[0].passed
        });
      });
      }else{
          if(!arr.passed){
            Question.find({passed: false}).sort({date:-1}).limit(1).lean().exec().then(
            (data) => {   
            res.render('correct-ans', {wrong_num: data[0].wrong_num, score : data[0].score})});
            arr.passed = true;
            arr.save();
          }else{
              Question.findOne({passed: false}, function (err , d){
              d.score -= 100;
              d.wrong_num += 1;
              d.save()
              console.log(d)
              });
            Question.find({}).sort({date:-1}).limit(1).lean().exec().then(
            (data) => {            
            res.render('game-started', 
            {
            cur_question : data[0].questionName,
            wrong_num : data[0].wrong_num ,
            category :data[0].category,
            passed: data[0].passed
            }
          );
        });
    }}}).sort({date:-1});
});

app.post('/history',(req,res) =>{
    Question.find({}, function(err,data){
    if (err) { throw(err); }
      res.render('quest-history', { data: data });
    }
    ).sort({date:-1}).limit(10)
})

app.get('/',(req,res) =>{
    res.render('index')
})

app.listen(port, () => {
  console.log("Server listening on port " + port);
});