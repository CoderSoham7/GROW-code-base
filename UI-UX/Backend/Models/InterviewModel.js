import mongoose from 'mongoose';

const InterviewSchema = new mongoose.Schema(
  {
    uuid: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    candidate_id: {
        type: Number,
        ref: 'User',
        required: true,
    },
    coverletter: {
        type: String,
    },
    covertext: {
        type: String,
    },
    interview_drive: {
        type: String,
        required: true,
        default: "No skill assigned",
    },
    interview_drive_version: {
        type: String,
        required: true,
        default: "v0",
    },
    ubase: {
        type: String,
    },
    interview_date:{
        type: String,
        default: 'NA'
    },
    assigned_interview_start_time: {
        type: String,
        default: 'Not Assigned'
    },
    assigned_interview_end_time: {
        type: String,
        default: 'Not Assigned'
    } ,
    interview_result: {
        type: String,
        required: true,
        default: "Interview result unavailable"
    },
    interview_label: {
        type: String,
        required: true,
        default: "NA"
    },
    interview_completed: {
            type: Boolean,
            required: true,
            default: false
    },
    interview_start_time: {
            type: String,
            default: '00:00:00 AM'
    },
    interview_end_time: {
            type: String,
            default: '00:00:00 AM'
    },
    assessment_category: {
        type: String,
        default: 'Not Assigned'
    },
    assessment_pipeline:{
        type: String,
        default: 'NA'
    } ,
    /*
    chatlog: [{
        message: {
          type: String,
          required: true,
        },
    }],
    chatlog_timestamps: [{
        message: {
            type: String,
            required: true,
        },
    }],
    */
    chatlog: [{
        type: String,
        required: true,
    }],
    chatlog_timestamps: [{
        type: String,
        required: true,
    }],
    messages: [], 
    created_by: {
        type: String,
        required: true,
        default: "NA"
    },
    updated_by: {
        type: String,
        required: true,
        default: "NA"
    },
    interviewrecording:{
        type: String,
        default: 'NA'
    }    
    },
  {
    timestamps: true,
  }
);

const Interview = mongoose.model('Interview', InterviewSchema);

export { Interview };