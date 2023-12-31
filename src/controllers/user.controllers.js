import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import moment from 'moment';

const getUserProfile = (req, res) => {
  if (!req.user) {
    return res.status(400).json({ message: "User not Found" });
  }
  res.json({ status: "ok", data: req.user });
};

const updateAccountActive = async (req, res) => {
  try {
    const { id } = req.params;
    const update = await User.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          active: req.body.active,
        },
      },
      {
        new: true,
      }
    );
    res.send(update);
  } catch (error) {
    res.send(error);
  }
};

const updateUserProfile = async (req, res) => {
  if (!req.user) {
    return res.status(400).json({ message: "User not Found" });
  }
  const userID = req.user._id;
  const updateObject = req.body
  if (!updateObject) {
    return res.status(400).json({
      message: "Nothing to Update",
    });
  }
  try {
    const doc = await User.findByIdAndUpdate(userID, updateObject, {
      new: true
    })
      .select("-password -identities")
      .lean()
      .exec();
    return res.json({ status: "ok", data: doc });
  } catch (e) {
    console.log(e.message);
    if (e.message.includes("username_1 dup key")) {
      return res.status(500).json({
        message: "Error updating username, username already exists",
        error: e.message,
      });
    }
    res
      .status(500)
      .send({ message: "Error performing the update", error: e.message });
  }
};

const deleteUser = async (req, res) => {
  const Model = req.model;
  if (!req.user) {
    return res.status(400).json({ message: "User not Found" });
  }
  try {
    await Model.findOneAndDelete({ _id: req.user._id }).exec();
    res.json({ status: "ok", message: "User Deleted Successfully" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Error deleting User" });
  }
};

const changeUserPassword = async (req, res) => {
  const Modal = req.model;
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ message: "Required fields missing" });
  if (!req.user) return res.status(400).json({ message: "User Not Found" });
  try {
    const user = await Modal.findById(req.user._id);
    const match = await user.checkPassword(oldPassword);
    if (!match) return res.status(401).json({ message: "incorrect old password" });
    const doc = await Modal.findByIdAndUpdate(req.user._id);
    if (doc) {
      doc.password = newPassword;
      await doc.save();
    }
    res.json({ status: "OK", message: "Password Changed Successfully" });
  } catch (e) {
    console.log(e.message);
    res.status(500).json({
      message: "Error Occurred while changing password.",
      error: e.message,
    });
  }
};

const getUsers = async (req, res) => {
  let { page, limit } = req.query;
  page = page * 1;
  limit = limit * 1;
  let limitVal = limit;
  let skipeValue = (page - 1) * limitVal;
  try {
    if (!req.user) {
      return res.status(400).json({ message: "User Not Found" });
    }
    const totalRecords = await User.countDocuments({ userType: "user" });
    const user = await User.find({ userType: "user" })
      .sort({ createdAt: -1 })
      .limit(limitVal)
      .skip(skipeValue);
    res.status(200).json({ user, totalRecords: totalRecords });
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ message: "Error getting details" });
  }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id });

    if (user) {
      return res.status(200).json({
        status: "success",
        user,
      });
    } else {
      return res.status(404).json({
        status: "failed",
        message: "User Doesn't Exists",
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Error getting details" });
  }
};

const forgotPassword = async (req, res) => {
  let password;
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return res
      .status(200)
      .send({ status: "failed", message: "Email is not registered with us" });
  else {
    password = generatePassword(8)
    const hash = await bcrypt.hash(password, 8);
    const updateQuery = req.body
    try {
      await User.findOneAndUpdate(updateQuery, { password: hash }, { new: true })
      //send email or sms to send new password subscribe to a service like sendgrid or AWS SES
      res.status(200).send({ status: "success", message: "New password generated successfully. Please check ur email." })
    }
    catch (error) {
      return res.status(500).json({ status: "failed", message: "error.message" })
    }
  }

}

function generatePassword (length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength));
  }
  return result;
}

export async function handleKeywords(req, res, next) {
  const {keywords} = req.body;
    if (!req.user) {
    return res.status(400).json({ message: "User not Found" });
  }
  if (!keywords) {
    return res.status(400).json({ message: "Keywords are required field and is an Array" });
  }
  try {
    const user = await User.findOne({_id:req.user._id}).populate({path:'subscriptionPlan', model: 'subscriptionPlan'});
    if(user.subscriptionPlan.planType === 'Pro' && (keywords.length <= (user.subscriptionPlan.noOfKeywords || 25))){
      user.keywords = keywords.map(keyword=> ({keyword: keyword}));
    } else if(user.subscriptionPlan.planType === 'Starter' && (keywords.length <= (user.subscriptionPlan.noOfKeywords || 10))){
      user.keywords = keywords.map(keyword=> ({keyword: keyword}));
    } else {
      throw 'Number of keywords exceed your current plan please upgrade to PRO or Starter to add more keywords';
    }

    if(moment().isAfter(moment((user.subscriptionPlan.subscriptionPlanEndDate)))){
      throw 'Your subscription has ended, please subscribe to Starter or PRO plan'
    }
    const updatedUser = await user.save();
    res.status(200).send({ status: "success", message: "keywords updated successfully.", keywords: updatedUser.keywords })
  } catch (e) {
    console.log(e);
      return res.status(500).json({ status: "failed", message: e.message || e })
  }
}

export async function handleKeyword(req, res, next) {
  const {keyword} = req.body;
  const keyWordId = req.params.id;
    if (!req.user) {
    return res.status(400).json({ message: "User not Found" });
  }
  try {
    const user = await User.findOne({_id:req.user._id}).populate({path:'subscriptionPlan', model: 'subscriptionPlan'});
    const keywordFound = user.keywords.id({_id:keyWordId});
    keywordFound.keyword = keyword;
    const updatedUser = await user.save();
    res.status(200).send({ status: "success", message: "keywords updated successfully.", keywords: updatedUser.keywords })
  } catch (e) {
    console.log(e);
      return res.status(500).json({ status: "failed", message: e.message || e })
  }
}

export async function deleteKeyword(req, res, next) {
  const keyWordId = req.params.id;
    if (!req.user) {
    return res.status(400).json({ message: "User not Found" });
  }
  try {
    const user = await User.findOne({_id:req.user._id}).populate({path:'subscriptionPlan', model: 'subscriptionPlan'});
    user.keywords = user.keywords.filter(k=> k._id!=keyWordId);
    const updatedUser = await user.save();
    res.status(200).send({ status: "success", message: "keywords updated successfully.", keywords: updatedUser.keywords })
  } catch (e) {
    console.log(e);
      return res.status(500).json({ status: "failed", message: e.message || e })
  }
}

export async function fetchUserKeywords(req, res, next) {
    if (!req.user) {
    return res.status(400).json({ message: "User not Found" });
  }
  try {
    const user = await User.findOne({_id:req.user._id}).populate({path:'subscriptionPlan', model: 'subscriptionPlan'});
    if(moment().isAfter(user.subscriptionPlanEndDate)){
      user.subscriptionPlan = null;
      await user.save();
      throw 'Your subscription has ended, please subscribe to Starter or PRO plan'
    } else if(moment().isAfter(user.trailPlanEndDate)){
      user.trailPlanEndDate = null;
      user.trailPlanStartDate = null;
      await user.save();
    }
    res.status(200).send({ status: "success", keywords: user.keywords || [] })
  } catch (e) {
    console.log(e);
      return res.status(500).json({ status: "failed", message: e.message || e })
  }
}

export {
  getUserProfile,
  updateUserProfile,
  deleteUser,
  forgotPassword,
  changeUserPassword,
  getUsers,
  getUser,
  updateAccountActive,
};
