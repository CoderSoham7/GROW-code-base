import mongoose from "mongoose"


const EvalSchema = new mongoose.Schema(  
    {  
      candidate_id: {  
        type: Number,  
        required: true,  
      },  
      evaluated_trees: {  
        type: Array,  
        required: true,  
      },  
      interview_drive: {  
        type: String,  
        required: true,  
      },  
      Accept: {  
        type: Number,  
        required: true,  
      },  
      Fail: {  
        type: Number,  
        required: true,  
      },  
      Reject: {  
        type: Number,  
        required: true,  
      },  
      gemini_report: {  
        type: Object,  
        required: true,  
      },  
    },  
    {  
      timestamps: true,  
    }  
  );  

const EvalModel = mongoose.model("EvalModel", EvalSchema, 'evaltrees')

export { EvalModel }

