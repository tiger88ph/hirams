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
        'P' => 'For Approval'
    ],
    'active_client' => [
        'A' => 'Active'
    ],
    'inactive_client' => [
        'I' => 'Inactive'
    ],
    'pending_client' => [
        'P' => 'For Approval'
    ],
    // Codes that will enter to the database and status see by the Management
    'status_transaction' => [
        '100' => 'Create Transaction',
        '110' => 'Transaction Verification',
        //
        '200' => 'Assign Transaction',
        '210' => 'Transaction Items Management',
        '220' => 'Transaciton Items Verification',
        '230' => 'Canvasing',
        '240' => 'Canvas Verification',
        //
        '300' => 'Canvasing',
        '320' => 'Price Approval'
    ],
    'transaction_filter_content' => [
        '100' => 'Draft',
        '110' => 'Finalized',
        //
        '200' => 'For Assignment',
        '210' => 'Items Management',
        '220' => 'Items Verification',
        '230' => 'For Canvas',
        '240' => 'Canvas Verification',
        //
        '300' => 'Price Setting',
        '320' => 'Price Approval',
    ],
    // responsible for status of the Procurement Officer
    'proc_status' => [
        '100' => 'Draft',
        '110' => 'Finalized',
        '300' => 'Price Setting',
        '320' => 'Price Approval',
    ],
    'ao_status' => [
        '210' => 'Items Management',
        '220' => 'Items Verification',
        '230' => 'For Canvas',
        '240' => 'Canvas Verification',
    ],
    // code for the displaying of the revert button in the procurement
    'draft_code' => [
        '100' => 'Draft'
    ],
    // code for the displaying of the pricing btn the procurement
    'finalize_code' => [
        '110' => 'Finalized'
    ],
    // code for the displaying of the buttons in ao
    'items_management' => [
        '210' => 'Items Management'
    ],
    // code for the displaying of the buttons in ao
    'items_verification' => [
        '220' => 'Items Verification'
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
    ]
];
