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