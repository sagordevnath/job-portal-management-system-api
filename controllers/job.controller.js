const Company = require("../models/Company");
const Application = require("../models/Application");
const googleDriveService = require("../middleware/googleDriveService");
const Job = require("../models/Job");
const User = require("../models/User");
const {
  createJobService,
  updateJobService,
  getAllJobsService,
  getJobByIdService,
  applyJobService,
  getHighestPaidJobsService,
  getMostAppliedJobsService
} = require("../services/job.service");

exports.createJob = async (req, res, next) => {
  try {
    //check user token to find manager's company id. if it doesnt match with req.body.companyInfo then return
    const { email } = req.user;
    const manager = await User.findOne({ email });
    //get the company in which this manager is assigned
    const company = await Company.findOne({ managerName: manager._id });

    const { companyInfo } = req.body;
    if (company._id.toString() !== companyInfo.toString()) {
      return res.status(400).json({
        status: "fail",
        message: "You are not authorized to create job for this company",
      });
    }

    // deadline must be atleast 1 day from now otherwise return
    //deadline formate 2022-01-01
    const { deadline } = req.body;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    if (deadlineDate < today) {
      return res.status(400).json({
        status: "fail",
        message: "Deadline must be atleast 1 day from now",
      });
    }

    // save or create

    const result = await createJobService(req.body);

    res.status(200).json({
      status: "success",
      message: "Job created successfully!",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: " Data is not inserted ",
      error: error.message,
    });
  }
};

exports.getJobsByManagerToken = async (req, res) => {
  try {
    const { email } = req.user;
    //get user by this email from User model
    const user = await User.findOne({ email }).select(
      "-password -__v -createdAt -updatedAt -role -status -appliedJobs"
    );
    //get company by this user from Company model inside managerName field
    const company = await Company.findOne({ managerName: user._id });

    //get all jobs
    const jobs = await Job.find({}).select("-applications").populate({
      path: "companyInfo",
      select: "-jobPosts",
    });
    //find the jobs by company id
    const jobsByCompany = jobs.filter((job) => {
      return job.companyInfo._id.toString() == company._id.toString();
    });

    res.status(200).json({
      status: "success",
      data: {
        managerInfo: user,
        jobs: jobsByCompany,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: "can't get the data",
      error: error.message,
    });
  }
};

exports.getJobByManagerTokenJobId = async (req, res) => {
  try {
    const { email } = req.user;
    //get user by this email from User model
    const user = await User.findOne({ email }).select(
      "-password -__v -createdAt -updatedAt -role -status -appliedJobs"
    );
    //get company by this user from Company model inside managerName field
    const company = await Company.findOne({ managerName: user._id });

    //get all jobs
    const jobs = await Job.find({})
      .populate({
        path: "companyInfo",
        select: "-jobPosts",
      })
      .populate({
        path: "applications",
        populate: {
          path: "applicant",
          select:
            "-password -__v -createdAt -updatedAt -role -status -appliedJobs",
        },
        select: "-job",
      })
      .populate({
        path: "companyInfo",
        select: "-jobPosts",
        populate: {
          path: "managerName",
          select:
            "-password -__v -createdAt -updatedAt -role -status -appliedJobs",
        },
      });

    //find the required job from jobs  with req.params id
    const { id } = req.params;
    const job = jobs.find((job) => {
      return job._id.toString() == id.toString();
    });

    //check if managerName.email is equal to req.user.email
    if (req.user.email !== job.companyInfo.managerName.email) {
      return res.status(400).json({
        status: "fail",
        message: "You are not authorized to get internal data of this job",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        job,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: "can't get the data",
      error: error.message,
    });
  }
};

