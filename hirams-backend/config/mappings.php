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
        '110' => 'Creating Transaction',
        '120' => 'Verifying Transaction',
        '130' => 'Assigning Account Officer',
        '210' => 'Canvassing Items',
        '220' => 'Verifying Canvassed Items',
        '310' => 'Encoding Selling Price',
        '320' => 'Verifying Selling Price',
        '410' => 'Approving Transaction',
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
