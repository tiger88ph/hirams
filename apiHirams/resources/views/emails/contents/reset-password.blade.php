@extends('emails.index')

@section('content')
<div class="body">

  <p class="greeting">
    Hi <strong>{{ $user->strUserName }}</strong>,<br><br>
    We received a request to reset the password for your HiRAMS account.
    Click the button below to choose a new password.
  </p>

  <div class="divider"></div>

  <div class="notice">
    <span class="notice-icon">⏱</span>
    <span>
      This link will expire in <strong>60 minutes</strong>. If you did not request
      a password reset, you can safely ignore this email — your password will not change.
    </span>
  </div>

  <div class="btn-wrap">
    <a href="{{ $resetUrl }}" class="btn">Reset My Password</a>
  </div>

  <p class="fallback">
    If the button above doesn't work, copy and paste this link into your browser:<br>
    <a href="{{ $resetUrl }}">{{ $resetUrl }}</a>
  </p>

</div>
@endsection