import mongoose from "mongoose"

const JDSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
    },
    skills: {
      type: String,
      required: true,
    },
    sections: {
      type: String,
      required: true,
    },
    question_pattern: {
      type: String,
      required: true,
    },
    skill_level_version: {
      type: String,
      required: true,
      default: "v0",
    },
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
    Question_bank: {
      type: String
    }    
},
{
  timestamps: true,
}
)
const JDModel = mongoose.model("JDModel", JDSchema, 'OpenAIPrompts')
export { JDModel }

