# Simple Task-Assgnment Project

This project is developed for NKU's *Computer Organization and Design* class.

## Requirement

+ [Node.js 9.9.0+](https://www.nodejs.org), [PM2](http://pm2.keymetrics.io/)(optional) 
+ A postgreSQL 10 server running at localhost, with or without a password (Default database: postgres, user: sunrisefox, authtype: trust, modify it by editing '/config/db.js')
+ A redis server running at localhost for session storage.

## How to use

+ Import init.sql and triggers.sql to your database (like `psql -U sunrisefox -d postgres -a -f init.sql` or something).
+ make a dir at /var/www/upload with perm 777 (?)
+ run `pm2 start bin/www --name co` or `node bin/www` only if you hate pm2.
+ it will run at `localhost:3000` by default. Enjoy.

## Basic Features

+ Yes, it contains only basic features:(

License
----

MIT

Please note that the font, css or javascript library used in this project may not be the same license. Check it yourself.
