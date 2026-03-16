@extends('emails.index')

@section('content')
<div class="body">
  <p class="greeting">Hello,</p>

  <div class="divider"></div>

  <p class="greeting">
    You're one step away from completing your registration.
    Use the verification code below to confirm your email address.
    <strong>Do not share this code with anyone.</strong>
  </p>

  <div class="otp-plain">{{ $otp }}</div>

  <p class="expiry">⏱ This code expires in <strong>10 minutes</strong>.</p>

  <br/>

  <p style="color:#6b7280; font-size:13px; line-height:1.7;">
    If you did not request this, you can safely ignore this email.
    Someone may have entered your email address by mistake.
  </p>
</div>
@endsection