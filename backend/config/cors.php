<?php
return [
    'paths'=>['api/*'],
    'allowed_methods'=>['GET','POST','PATCH','DELETE','OPTIONS'],
    'allowed_origins'=>[],
    'allowed_origins_patterns'=>[],
    'allowed_headers'=>['Content-Type','X-Requested-With','X-Tracking-Code'],
    'exposed_headers'=>[], 'max_age'=>0, 'supports_credentials'=>false,
];
