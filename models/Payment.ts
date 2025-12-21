import mongoose, { Schema, Document } from "mongoose";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  subscription: mongoose.Types.ObjectId;

  amount: number;
  currency: string;
  status: PaymentStatus;

  // Stripe payment info
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;

  // Payment details
  paymentMethod?: string; // e.g., "card", "bank_transfer"
  paymentDate?: Date;
  failureReason?: string;

  // Period this payment is for
  periodStart: Date;
  periodEnd: Date;

  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "usd",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      required: true,
      default: "pending",
    },

    // Stripe info
    stripePaymentIntentId: {
      type: String,
      sparse: true,
      unique: true,
    },
    stripeInvoiceId: {
      type: String,
      sparse: true,
    },

    // Payment details
    paymentMethod: { type: String },
    paymentDate: { type: Date },
    failureReason: { type: String },

    // Period coverage
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for performance and queries
paymentSchema.index({ user: 1, createdAt: -1 }); // For user payment history
paymentSchema.index({ subscription: 1 }); // For subscription payments
paymentSchema.index({ status: 1 }); // For filtering by status

// Helper method to check if payment was successful
paymentSchema.methods.isSuccessful = function(): boolean {
  return this.status === "succeeded";
};

// Helper method to check if payment failed
paymentSchema.methods.hasFailed = function(): boolean {
  return this.status === "failed";
};

export const Payment = mongoose.models.Payment ||
  mongoose.model<IPayment>("Payment", paymentSchema);
