const express = require("express");
const Router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

// Load Input Validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

// Load User model
const Login1 = require("../../models/Login1");

// Post Router api/users/register
Router.post("/register1", async (req, res) => {
  try {
    // Form Validation
    // Destructuring Values
    const { errors, isValid } = validateRegisterInput(req.body);

    // Check Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const user = await Login1.findOne({ email: req.body.email });

    if (user) {
      return res.status(400).json({
        email: "Email already exists",
      });
    } else {
      const newUser = new Login1({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
      });

      // Hash password before saving in the database
      const salt = await bcrypt.genSalt(10);
      newUser.password = await bcrypt.hash(newUser.password, salt);

      await newUser.save();
      res.json(newUser);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Post Router api/users/login
Router.post("/login1", async (req, res) => {
  try {
    // Login Validation
    const { errors, isValid } = validateLoginInput(req.body);

    // Check Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const email = req.body.email;
    const password = req.body.password;

    // Find User By Email
    const user = await Login1.findOne({ email });

    if (!user) {
      return res.status(404).json({
        emailNotFound: "Email is not registered",
      });
    }

    // Match Password
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // User Matched
      // Create JWT Payload
      const payload = {
        id: user.id,
        name: user.name,
      };

      // Sign Token
      jwt.sign(
        payload,
        config.get("secretOrKey"),
        {
          expiresIn: "2 years", // Use a string with units for readability
        },
        (err, token) => {
          if (err) throw err;
          res.json({
            success: true,
            token: "Bearer " + token, // Add a space after "Bearer"
          });
        }
      );
    } else {
      return res.status(400).json({
        passwordIncorrect: "Password incorrect",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = Router;





