const mongoose = require('mongoose');

const PlannerEventSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    dateKey: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    hour: {
      type: Number, // 0 - 23
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    color: {
      type: String,
      default: 'purple',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlannerEvent', PlannerEventSchema);
