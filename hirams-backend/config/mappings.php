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
        '110' => 'Draft Transaction',
        '120' => 'Finalize Transaction',
        '130' => 'Assignment of AO',
        '210' => 'Encoding/Canvassing of Items',
        '220' => 'Finalize Canvassing',
        '310' => 'Encoding Selling Price',
        '320' => 'Finalize Selling Price',
        '410' => 'Approval of Transaction',
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
