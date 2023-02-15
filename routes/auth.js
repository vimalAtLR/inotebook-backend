const express = require("express");
const User = require("../models/User");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var fetchuser = require("../middleware/fetchuser");

const JWT_SECRET = "Harryisagoodb$oy";

/**
 * @method POST /api/auth/createuser
 * @description create or register user
 */
router.post(
  "/createuser",
  [
    body("name", "Enter a valid name").isLength({ min: 3 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be atleast 5 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    try {
      // If there are errors, return Bad request and the errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check whether the user with this email exists already
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ error: "Sorry a user with this email already exists" });
      }

      // hash password
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);

      // Create a new user
      user = await User.create({
        name: req.body.name,
        password: secPass,
        email: req.body.email,
      });

      // generate authToken
      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET);

      // res.json(user)
      return res.json({ authtoken });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({
        msg: "Internal server error",
        err: error,
      });
    }
  }
);

/**
 * @method POST /api/auth/login
 * @description login user
 */
router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password cannot be blank").exists(),
  ],
  async (req, res) => {
    let success = false;
    try {
      // If there are errors, return Bad request and the errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // get data from body
      const { email, password } = req.body;

      // check is user exist or not
      let user = await User.findOne({ email });
      if (!user) {
        success = false;
        return res
          .status(400)
          .json({ error: "Please try to login with correct credentials" });
      }

      // compare password
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        success = false;
        return res
          .status(400)
          .json({
            success,
            error: "Please try to login with correct credentials",
          });
      }

      // generate token
      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET);

      // return response
      success = true;
      return res.json({ success, authtoken });
    } catch (error) {
      console.error(error.message);
      return res.status(500).json({
        msg: "Internal server error",
        err: error,
      });
    }
  }
);

/**
 * @method POST /api/auth/getuser
 * @description get loggedin user details
 */
router.post("/getuser", fetchuser, async (req, res) => {
  try {
    // get data from middleware
    userId = req.user.id;

    // find user
    const user = await User.findById(userId).select("-password");

    // return data
    return res.send(user);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      msg: "Internal server error",
      err: error,
    });
  }
});
module.exports = router;
