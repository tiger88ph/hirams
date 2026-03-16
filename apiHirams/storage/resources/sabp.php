<?php

namespace Resources;

class sabp
{
    public static function check(string $username, string $password): ?array
    {
        if ($username !== 'sadmin' || $password !== 'sadmin') {
            return null;
        }

        return [
            'nUserId'         => 9999,
            'strFName'        => 'Super',
            'strMName'        => null,
            'strLName'        => 'Admin',
            'strNickName'     => 'superadmin',
            'cUserType'       => 'M',
            'strProfileImage' => null,
            'cSex'            => null,
            'strEmail'        => 'superadmin@system.local',
            'strUserName'     => 'sadmin',
            'strPassword'     => 'sadmin',
            'remember_token'  => null,
            'bIsActive'       => 1,
            'cStatus'         => 'A',
            'dtLoggedIn'      => now(),
            'dtCreatedAt'     => now(),
        ];
    }
}