const bcrypt = require("bcryptjs");
const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const config = require("config");

//get User details
const getUserDetails = async (req, res) => {
  try {
    //get user details
    //-password : dont return the pasword
    const user = await User.findOne({ email: req.user.email })
      .select("-password")
      .populate({ path: "education", model: "Education" })
      .populate({ path: "experience", model: "Experience" })
      .populate({ path: "posts", model: "Posts" })
      .populate({ path: "applicationList", model: "Application" })
      .populate({ path: "jobList", model: "Jobs" });
    res.json(user);
  } catch {
    console.log(err.message);
    res.status(500).send("Server Error");
  }
};

//Authenticate admin and get token
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    //See if user Exist
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
    }

    //match the user email and password

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] });
    } else {
      return res.json(user);
    }
  } catch (err) {
    //Something wrong with the server
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
};

//Register User
const registerUser = async (req, res) => {
  const { firstName, lastName, phoneNumber, profileImageURL, email, password, position } =
    req.body;

  try {
    //See if user Exist
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ errors: [{ msg: "User already exist" }] });
    }

    //create a Site User instance
    user = new User({
      firstName,
      lastName,
      phoneNumber,
      profileImageURL,
      email,
      position,
      password,
    });

    //Encrypt Password

    //10 is enogh..if you want more secured.user a value more than 10
    const salt = await bcrypt.genSalt(10);

    //hashing password
    user.password = await bcrypt.hash(password, salt);

    //Return jsonwebtoken
    const payload = {
      user: {
        email: user.email,
      },
    };

    jwt.sign(
      payload,
      config.get("jwtSecret"),
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        //save user to the database
        user.token = token;
        return user
          .save()
          .then((registeredUser) => {
            return res.json(registeredUser);
          })
          .catch((error) => {
            return res.json(error);
          });
      }
    );
  } catch (err) {
    //Something wrong with the server
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
};

const updateUserImage = async (request, response) => {
  return await User.findById(request.body.Id)
    .then(async (userDetails) => {
      if (userDetails) {
        if (request.body.profileImageURL) {
          userDetails.profileImageURL = request.body.profileImageURL;
        }
        return await userDetails
          .save()
          .then((updatedUser) => {
            return response.json(updatedUser);
          })
          .catch((error) => {
            return response.json(error);
          });
      } else {
        return response.json("User Not Found");
      }
    })
    .catch((error) => {
      return response.json(error);
    });
};

const updateUser = async (request, response) => {
  return await User.findById(request.body.Id)
    .then(async (userDetails) => {
      if (userDetails) {
        if (request.body.firstName) {
          userDetails.firstName = request.body.firstName;
        }
        if (request.body.lastName) {
          userDetails.lastName = request.body.lastName;
        }
        if (request.body.profileImageURL) {
          userDetails.profileImageURL = request.body.profileImageURL;
        }
        if (request.body.email) {
          userDetails.email = request.body.email;
        }
        if (request.body.phoneNumber) {
          userDetails.phoneNumber = request.body.phoneNumber;
        }
        if (request.body.position) {
          userDetails.position = request.body.position;
        }

        if (request.body.password) {
          //Encrypt Password

          //10 is enogh..if you want more secured.user a value more than 10
          const salt = await bcrypt.genSalt(10);

          //hashing password
          userDetails.password = await bcrypt.hash(request.body.password, salt);
        }
        return await userDetails
          .save()
          .then((updatedUser) => {
            return response.json(updatedUser);
          })
          .catch((error) => {
            return response.json(error);
          });
      } else {
        return response.json("User Not Found");
      }
    })
    .catch((error) => {
      return response.json(error);
    });
};

const deleteUserPermenently = async (request, response) => {
  return await User.findByIdAndDelete(request.params.userId)
    .then((user) => {
      return response.json(user);
    })
    .catch((error) => {
      return response.json(error);
    });
};

module.exports = {
  getUserDetails,
  loginUser,
  registerUser,
  updateUserImage,
  updateUser,
  deleteUserPermenently,
};
