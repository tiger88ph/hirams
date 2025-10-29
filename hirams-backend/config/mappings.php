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
        '110' => 'Drafted Transaction',
        '120' => 'Finalized Transaction',
        '130' => 'Assigned AO',
        '210' => 'Encoded/Canvassed Items',
        '220' => 'Finalized Canvassing',
        '310' => 'Encoded Selling Price',
        '320' => 'Finalized Selling Price',
        '410' => 'Approved Transaction',
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
