<?php

namespace App\Helpers;

use Carbon\Carbon;

class TimeHelper
{
    const TIMEZONE = 'Asia/Manila';

    /**
     * Get the current time in Philippines timezone.
     */
    public static function now(): Carbon
    {
        return Carbon::now(self::TIMEZONE);
    }

    /**
     * Parse a given datetime string in Philippines timezone.
     */
    public static function parse(string $datetime): Carbon
    {
        return Carbon::parse($datetime, self::TIMEZONE);
    }
}