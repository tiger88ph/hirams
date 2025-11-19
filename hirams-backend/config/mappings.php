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
    'unit_of_measurements' => [
        'pcs' => 'Piece(s)',
        'pack' => 'Pack',
        'box' => 'Box',
        'set' => 'Set',
        'unit' => 'Unit',
        'pair' => 'Pair',
        'roll' => 'Roll',
        'm' => 'Meter',
        'cm' => 'Centimeter',
        'mm' => 'Millimeter',
        'ft' => 'Feet',
        'in' => 'Inch',
        'L' => 'Liter',
        'mL' => 'Milliliter',
        'kg' => 'Kilogram',
        'g' => 'Gram',
        'ton' => 'Ton',
        'bundle' => 'Bundle',
        'bottle' => 'Bottle',
        'can' => 'Can',
        'jar' => 'Jar',
        'bag' => 'Bag',
        'dozen' => 'Dozen',
        'ream' => 'Ream',
        'gal' => 'Gallon',
        'sheet' => 'Sheet',
        'tablet' => 'Tablet',
        'sachet' => 'Sachet',
        'carton' => 'Carton',
        'rim' => 'Rim',
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
        '310' => 'Price Verification',
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
        '310' => 'Price Verification',
        '320' => 'Price Approval',
    ],
    // responsible for status of the Procurement Officer
    'proc_status' => [
        '100' => 'Draft',
        '110' => 'Finalized',
        '300' => 'Price Setting',
        '310' => 'Price Verification',
        '320' => 'Price Approval',
    ],
    'ao_status' => [
        '210' => 'Items Management',
        '220' => 'Items Verification',
        '230' => 'For Canvas',
        '240' => 'Canvas Verification',
    ],
    //INDIVIDUAL STATUS CODES - GENERAL USE 
    'draft_code' => [
        '100' => 'Draft'
    ],
    'finalize_code' => [
        '110' => 'Finalized'
    ],
    'for_assignment' => [
        '200' => 'For Assignment',
    ],
    'items_management' => [
        '210' => 'Items Management'
    ],
    'items_verification' => [
        '220' => 'Items Verification'
    ],
    'for_canvas' => [
        '230' => 'For Canvas',
    ],
    'canvas_verification' => [
        '240' => 'Canvas Verification',
    ],
    'price_setting' => [
        '300' => 'Price Setting',
    ],
    'price_verification' => [
        '310' => 'Price Verification',
    ],
    'price_approval' => [
        '320' => 'Price Approval',
    ],
];
