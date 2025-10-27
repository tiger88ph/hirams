<?php

return [
    'status' => [
        'A' => 'Active',
        'I' => 'Inactive',
    ],

    'user_types' => [
        'A' => 'Account Officer',
        'M' => 'Management',
        'F' => 'Finance Officer',
        'P' => 'Procurement Officer',
        'G' => 'General Manager'
    ],

    'gender' => [
        'M' => 'Male',
        'F' => 'Female',
        'O' => 'Other',
    ],

    'vat' => [
        1 => 'VAT',
        0 => 'NVAT',
    ],

    'ewt' => [
        1 => 'EWT',
        0 => 'N/A',
    ],

    'status_client' => [
        'A' => 'Active',
        'I' => 'Inactive',
        'P' => 'Pending'
    ],

    'status_transaction' => [
        '110' => 'AO Assignment',
        '210' => 'Item Encoding',
        '220' => 'Item Canvassing',
        '310' => 'Selling Price Encoding',
        '410' => 'Transaction Approval',
    ],

    'proc_source' => [
        'O' => 'Online',
        'W' => 'Walk-in'
    ],

    'item_type' => [
        'G' => 'Goods',
        'S' => 'Service'
    ],

    'proc_mode' => [
        'R' => 'RFQ'
    ]


];
