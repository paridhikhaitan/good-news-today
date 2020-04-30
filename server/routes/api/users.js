const express = require("express");
const router = express.Router();
const Users = require("../../model/Users");

//Define All APIs for Users here

//@route test
router.get("/test", (req, res) => res.send("User route testing"));

//@route to get all users
router.get("/", (req, res) => {
  Users.find()
    .then(user => {
      res.json(user);
    })
    .catch(error => {
      res.status(400).json({
        msg: "Error fetching all users"
      });
    });
});

//@route get a specific user by ID
router.get("/:id", (req, res) => {
  Users.findById(req.params.id)
    .then(user => {
      res.json(user);
    })
    .catch(error => {
      res.json({
        error: `Unable to get user with id ${req.params.id}`
      });
    });
});

router.post("/add", (req, res) => {
  console.log(req.body);
  Users.create(req.body)
    .then(user => {
      res.json({
        success: true
      });
    })
    .catch(error => {
      res.status(400).json({
        error: "Error adding the user",
        success: false
      });
    });
});

router.put("/:id", (req, res) => {
  Users.findByIdAndUpdate(req.params.id, req.body)
    .then(user => {
      res.json({ msg: "User has been updated" });
    })
    .catch(error => {
      res.json({ msg: "Unable to update user" });
    });
});

router.delete("/:id", (req, res) => {
  Users.findByIdAndDelete(req.params.id, req.body)
    .then(user =>
      res.json({
        msg: "User has been deleted"
      })
    )
    .catch(error =>
      res.status(404).json({
        error: "No such user"
      })
    );
});

module.exports = router;
