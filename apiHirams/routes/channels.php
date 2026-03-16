<?php
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('transactions',                               fn() => true);
Broadcast::channel('users',                                      fn() => true);
Broadcast::channel('companies',                                  fn() => true);
Broadcast::channel('clients',                                    fn() => true);
Broadcast::channel('suppliers',                                  fn() => true);
Broadcast::channel('direct-costs',                               fn() => true);
Broadcast::channel('transaction.{transactionId}.items',          fn() => true);
Broadcast::channel('transaction.{transactionId}.pricing-sets',   fn() => true);
Broadcast::channel('pricing-set.{pricingSetId}.item-pricings', fn() => true);