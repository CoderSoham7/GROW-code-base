import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    candidate_id: {
      type: Number,
      required: true,
    },
    interviews: [{
      type: String,
      ref: 'Interview',
      required: true,
    }],
    CSRF_token:{
      type: String
    },
  },
  {
    timestamps: true,
  }
)

UserSchema.methods.matchPassword = async function (pass) {
  return await bcrypt.compare(pass, this.password)
}

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

const User = mongoose.model("User", UserSchema)

export { User }