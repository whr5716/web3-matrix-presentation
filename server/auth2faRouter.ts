import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import {
  generateOTP,
  createSessionToken,
  verifySessionToken,
} from "./_core/auth2fa";

// Simple in-memory store for OTPs (in production, use database)
const otpStore: Map<string, { otp: string; expiresAt: number }> = new Map();

export const auth2faRouter = router({
  /**
   * Request OTP for email
   */
  requestOTP: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const { email } = input;

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store OTP
      otpStore.set(email, { otp, expiresAt });

      // In production, send OTP via email
      console.log(`[2FA] OTP for ${email}: ${otp}`);

      return {
        success: true,
        message: "OTP sent to your email",
        // For demo purposes, return OTP (remove in production)
        demo_otp: process.env.NODE_ENV === "development" ? otp : undefined,
      };
    }),

  /**
   * Verify OTP and create session
   */
  verifyOTP: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        otp: z.string(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email, otp, name } = input;

      // Check if OTP exists and is valid
      const storedOTP = otpStore.get(email);
      if (!storedOTP) {
        return {
          success: false,
          error: "OTP not found. Please request a new one.",
        };
      }

      // Check if OTP is expired
      if (Date.now() > storedOTP.expiresAt) {
        otpStore.delete(email);
        return {
          success: false,
          error: "OTP expired. Please request a new one.",
        };
      }

      // Check if OTP matches
      if (storedOTP.otp !== otp) {
        return {
          success: false,
          error: "Invalid OTP. Please try again.",
        };
      }

      // OTP is valid, create session
      otpStore.delete(email);

      const sessionPayload = {
        userId: email.split("@")[0], // Simple user ID from email
        email,
        name: name || email.split("@")[0],
        role: 'user' as const, // Default role
      };

      const sessionToken = await createSessionToken(sessionPayload);

      // Set session cookie
      ctx.res.cookie("session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return {
        success: true,
        message: "Login successful",
        user: sessionPayload,
      };
    }),

  /**
   * Get current user from session
   */
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }
    return ctx.user;
  }),

  /**
   * Logout
   */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    ctx.res.clearCookie("session");
    return { success: true, message: "Logged out successfully" };
  }),
});
