import { SubscriptionPlan } from '../models/subscriptionplan.model';
import { User } from '../models/user.model';
import moment from 'moment';
export const subscribeToPlan = async (req, res) => {
  if (!req.user) {
    return res.status(400).json({ message: "User not Found" });
  }

  const subscriptionId = req.params.id;
  if(!subscriptionId){
    return res.status(400).json({ message: "Please select subscription plan" });
  }

  try {
    const subscriptionplan = await SubscriptionPlan.findOne({_id: subscriptionId});
    if(!subscriptionplan){
      throw 'No such subscription plan found or subscription plan expired.'
    } else {
      const user = await User.findById(req.user._id).populate({path:'subscriptionPlan', model: 'subscriptionPlan'});
      if(user.subscriptionPlan){
        throw `You already have ${user.subscriptionPlan.planType} subscription plan`;
      }

      const updateData= {
        subscriptionPlan: subscriptionId,
        subscriptionPlanStartDate: moment().add(7,'days').toDate(),
        subscriptionPlanEndDate: moment().add(1,'month').toDate(),
      };
      if(!user.trailPlanStartDate){
        updateData.trailPlanStartDate= moment().toDate();
        updateData.trailPlanEndDate= moment().add(7,'days').toDate();
        updateData.subscriptionPlanEndDate= moment(moment().add(7,'days').toDate()).add(1,'month').toDate();
      };
      const subscribetoUser = await User.findOneAndUpdate({_id: req.user._id}, updateData, {new: true});
      res.json({ status: "subscribed successfully", data: subscribetoUser });
    }
  } catch (e) {
    console.log(e);
    return res.status(400).json({ message: e || e.message, errStack: e });
  }
};

export const subscriptionPlans = async (req, res, next) =>{
  try {
    const plans  = await SubscriptionPlan.find({});
    res.json({ status: "success", data: plans });
  } catch (e) {
    return res.status(400).json({ message: e || e.message, errStack: e });
  }
}

export const deleteSubscriptionPlan = async (req, res, next) =>{
  const {subscriptionId} = req.body;
  if(!subscriptionId){
    return res.status(400).json({ message: "Please select subscription plan" });
  }
  try {
    await SubscriptionPlan.findByIdAndDelete(subscriptionId);
    res.json({ status: "success"});
  } catch (e) {
    return res.status(400).json({ message: e || e.message, errStack: e });
  }
}

export const addSubscriptionPlan = async (req, res, next) =>{
  const {planPrice, planType} = req.body;
  if(!planPrice || !planType){
    return res.status(400).json({ message: "Please enter required fields" });
  }
  try {
    const plan = await SubscriptionPlan.create({planPrice, planType});
    res.json({ status: "success", data: plan});
  } catch (e) {
    return res.status(400).json({ message: e || e.message, errStack: e });
  }
}
