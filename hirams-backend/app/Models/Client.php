<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Client extends Model
{
    use HasFactory;

    // Specify the table name
    protected $table = 'tblclients';

    // Optional: specify the primary key if not 'id'
    protected $primaryKey = 'nClientId';

    protected $fillable = [
        'strClientName',
        'strClientNickName', 
        'strTIN',
        'strAddress',
        'strBusinessStyle',
        'strContactPerson',
        'strContactNumber',
    ];

     // ❌ Disable timestamps
    public $timestamps = false;
}
