<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SqlErrors extends Model
{
    use HasFactory;

    protected $table = "tblsqlerrors";

    protected $primaryKey = "nErrorId";

    protected $fillable = [
        'dtDate',
        'strError'
    ];

    public $timestamps = false;

}
