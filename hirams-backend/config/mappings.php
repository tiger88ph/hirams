<?php
return [
    'status' => [
        'A' => 'Active',
        'I' => 'Inactive',
    ],
    'user_types' => [
        'A' => 'Account Officer',//0
        'M' => 'Management',//1
        'F' => 'Finance Officer',//2
        'P' => 'Procurement Officer',//3
        'G' => 'General Manager',//4
        'X' => 'Account Officer TL',//5
        'Y' => 'Procurement Officer TL',//6
    ],
    'sex' => [
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
    'proc_source' => [
        'P' => 'PhilGEPS',
        'W' => 'Walk-in',
        'R' => 'Referral',
        'O' => 'Online',
    ],
    'item_type' => [
        'G' => 'Goods',
        'S' => 'Service'
    ],
    'proc_mode' => [
        'R' => 'RFQ',
        'B' => 'Bidding',
        'E' => 'Emergency Procurement',
        'N' => 'Negotiated Procurement'
    ],
    'status_client' => [
        'A' => 'Active',
        'I' => 'Inactive',
        'P' => 'For Approval'
    ],
    'status_transaction' => [
        '100' => 'Create Transaction',
        '110' => 'Transaction Verification',
        '200' => 'Assign Transaction',
        '210' => 'Transaction Items Management',
        '220' => 'Transaciton Items Verification',
        '230' => 'Canvasing',
        '240' => 'Canvas Verification',
        '300' => 'Price Management',
        '310' => 'Price Verification',
        '320' => 'Price Approval'
    ],
    'transaction_filter_content' => [
        '100' => 'Draft',
        '110' => 'Transaction Verification',
        '200' => 'For Assignment',
        '210' => 'Items Management',
        '220' => 'Items Verification',
        '230' => 'For Canvas',
        '240' => 'Canvas Verification',
        '300' => 'Price Setting',
        '310' => 'Price Verification',
        '320' => 'Price Approval',
    ],
    'proc_status' => [
        '100' => 'Draft',
        '110' => 'Transaction Finalized',
        '115' => 'Transaction Verification',
        '300' => 'Price Setting',
        '310' => 'Price Finalized',
        '315' => 'Price Verification',
        '320' => 'Price Approval',
    ],
    'ao_status' => [
        '210' => 'Items Management',
        '220' => 'Items Finalized',
        '225' => 'Items Verification',
        '230' => 'For Canvas',
        '240' => 'Canvas Finalized',
        '245' => 'Canvas Verification',
    ],
    'vaGoSeValue' => [
        '1.12' => 'Vat',
        '0.01' => '1%',
        '0.02' => '2%',
    ],
];
