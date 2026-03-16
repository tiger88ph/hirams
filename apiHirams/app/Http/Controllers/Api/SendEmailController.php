<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OtpMail;
use App\Mail\ResetPasswordMail;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Mail;

class SendEmailController extends Controller
{
    /**
     * Send password reset link email.
     */
    public function forgotPassword(User $user, string $resetUrl): bool
    {
        try {
            Mail::to($user->strEmail)->send(new ResetPasswordMail($user, $resetUrl));
            return true;
        } catch (Exception $e) {
            report($e);
            return false;
        }
    }

    /**
     * Send a 6-digit OTP for registration email verification.
     */
    public function sendOtp(string $email, string $otp): bool
    {
        try {
            Mail::to($email)->send(new OtpMail($otp));
            return true;
        } catch (Exception $e) {
            report($e);
            return false;
        }
    }
}