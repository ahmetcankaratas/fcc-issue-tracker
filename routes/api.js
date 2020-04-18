/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb");
var ObjectId = require("mongodb").ObjectID;
//my package's
var bodyParser = require("body-parser");

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function(app) {
  app
    .route("/api/issues/:project")

    .get(function(req, res) {
      var project = req.params.project;
      var query = req.query;
      if(query.open){
        if(query.open == 'true'){
          query.open = true
        }else if(query.open == 'false') {
          query.open = false
        }
      }
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        if (err) {
          throw err;
        }

        var dbo = db.db("issuesDB");

        dbo
          .collection("issues")
          .find(query)
          .toArray()
          .then(function(issues) {
            res.status(200).json(issues);
          });
        db.close;
      });
    })

    .post(function(req, res) {
      var project = req.params.project;
      var newIssue = {
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        created_on: new Date(),
        updated_on: new Date(),
        assigned_to: req.body.assigned_to || "",
        status_text: req.body.status_text || "",
        open: true
      };

    if (req.body.issue_title === undefined || (req.body.issue_text === undefined || req.body.created_by === undefined)) return res.type('text').send('missing inputs')
    
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        if (err) {
          throw err;
        }

        var dbo = db.db("issuesDB");

        dbo.collection("issues").insertOne(newIssue, function(err, docs) {
          if (err) res.json(err)
          res.json(docs.ops[0]);
          db.close();
        });
      });
    })

    .put(function(req, res) {
    var project = req.params.project;  
    const query = req.body._id;
      
      const filter = {
        _id : ObjectId(query)
      }
      function clean(obj){
        Object.keys(obj).forEach((key) => (obj[key] == '') && delete obj[key]);
        return obj
      }
    
      var update = clean(req.body)
      delete update['_id']  
      if(Object.keys(update).length === 0){
        res.type("text").send('no updated field sent');
      } else {
        update.updated_on = new Date();
        MongoClient.connect(CONNECTION_STRING, function(err, db){
          var dbo = db.db("issuesDB");
          dbo.collection("issues").updateOne(filter,{$set: update},function(err,docs){
            if(err) console.log(err);
            if(docs.result.n === 0){
              res.type("text").send('could not update')
            } else {
              res.type("text").send('successfully updated');
            };
            db.close();
          })
        })
      }
    })

    .delete(function(req, res) {
      var project = req.params.project;
      var body = req.body;
      var id = body._id;
      const regex = /^[0-9a-fA-F]{24}$/
      if(id.match(regex) == null){
        res.type("text").send('_id error');
      } else {
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        var dbo = db.db("issuesDB");
        var myquery = { _id: ObjectId(id) };
        dbo.collection("issues").deleteOne(myquery, function(err, result) {
          if (err) {
            res.type("text").send('_id error');
          db.close();
          };

         if (result.deletedCount === 0) {
              res.type("text").send('could not delete '+ id);
            } else {
              res.type("text").send('deleted '+ id);
            }   
          
          db.close();
        });
      });
      }
    });
};
