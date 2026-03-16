<?php
return [
    'status_user' => [
        'A' => 'Active',
        'I' => 'Inactive',
        'P' => 'For Approval',
    ],
    'user_types' => [
        'A' => 'Account Officer', //0
        'M' => 'Management', //1
        'F' => 'Finance Officer', //2
        'P' => 'Procurement Officer', //3
        'G' => 'General Manager', //4
        'X' => 'Account Officer TL', //5
        'Y' => 'Procurement Officer TL', //6
    ],
     'default_user_type' => [
        'V' => 'User', //0
    ],
    'sex' => [
        'M' => 'Male',
        'F' => 'Female',
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
        '100' => 'Create Transaction',//0
        '110' => 'Transaction Verification',//1
        '200' => 'Assign Transaction',//2
        '210' => 'Transaction Items Management',//3
        '220' => 'Transaciton Items Verification',//4
        '230' => 'Canvasing',//5
        '240' => 'Canvas Verification',//6
        '300' => 'Price Management',//7
        '310' => 'Price Verification',//8
        '320' => 'Price Approval'//9
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
        '100' => 'Draft',//0
        '110' => 'Transaction Finalized',//1
        '115' => 'Transaction Verification',//2
        '300' => 'Price Setting',//3
        '310' => 'Price Finalized',//4
        '315' => 'Price Verification',//5
        '320' => 'Price Approval',//6
    ],
    'ao_status' => [
        '210' => 'Items Management',//0
        '220' => 'Items Finalized',//1
        '225' => 'Items Verification',//2
        '230' => 'For Canvas',//3
        '240' => 'Canvas Finalized',//4
        '245' => 'Canvas Verification',//5
    ],
    'aotl_status' => [
        '200' => 'For Assignment',//0
        '210' => 'Items Management',//1
        '220' => 'Items Finalized',//2
        '225' => 'Items Verification',//3
        '230' => 'For Canvas',//4
        '240' => 'Canvas Finalized',//5
        '245' => 'Canvas Verification',//6
    ],
    'vaGoSeValue' => [
        '1.12' => 'Vat',
        '0.01' => '1%',
        '0.02' => '2%',
    ],
];
