<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{{ $title ?? 'HiRAMS' }}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #eef0f5;
      font-family: 'Segoe UI', sans-serif;
      color: #333;
      padding: 40px 16px;
    }

    .wrapper {
      max-width: 480px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 24px rgba(0,0,0,0.08);
    }
  /* ── GOtyme-style Header ── */
.header {
  background: #1a237e;
  border-radius: 0 0 28px 28px;
  padding: 22px 28px 20px;
  text-align: center;
  width: 100%;
}
.header img {
  height: 36px;
  width: auto;
  display: inline-block;
  vertical-align: middle;
}

    /* Body */
    .body {
      padding: 28px 36px 24px;
    }
    .greeting {
      font-size: 13.5px;
      color: #444;
      line-height: 1.75;
      margin-bottom: 20px;
    }
    .divider {
      height: 1px;
      background: #e8eaf0;
      margin: 0 0 20px;
    }

    /* OTP styles */
    .otp-plain {
      text-align: center;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 12px;
      color: #1e3a5f;
      background: #eff6ff;
      border: 2px solid #bfdbfe;
      border-radius: 12px;
      padding: 16px 24px;
      margin: 28px 0;
    }
    .expiry {
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      margin-top: -12px;
    }

    /* Notice box */
    .notice {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      background: #fffde7;
      border: 1px solid #ffe082;
      border-left: 4px solid #ffc107;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 24px;
      font-size: 12px;
      color: #6d5100;
      line-height: 1.65;
    }
    .notice-icon {
      font-size: 14px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* Button */
    .btn-wrap {
      text-align: center;
      margin: 24px 0 18px;
    }
    .btn {
      display: inline-block;
      padding: 11px 32px;
      background: #1a237e;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-size: 13.5px;
      font-weight: 600;
      font-family: 'Segoe UI', sans-serif;
      letter-spacing: 0.3px;
    }

    /* Fallback link */
    .fallback {
      font-size: 11.5px;
      color: #999;
      line-height: 1.7;
      word-break: break-all;
      margin-top: 16px;
    }
    .fallback a {
      color: #1a237e;
      text-decoration: underline;
    }

    /* Footer */
    .footer {
      background: #f5f6fa;
      border-top: 1px solid #e8eaf0;
      padding: 12px 36px;
      text-align: center;
      font-size: 10.5px;
      color: #bbb;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="wrapper">

    @include('emails.components.header')

    @yield('content')

    @include('emails.components.footer')

  </div>
</body>
</html>