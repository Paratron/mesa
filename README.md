Mesa CMS
========

![The mesa logo](logo/logo128.png)

This CMS aims to be a easy to use, yet flexible CMS that helps building simple to complex websites while providing
a clear, understandable UI for the people who need to maintain the website in the end.

Other CMS force a developer to build a website from pre-created content blocks in a certain way the system dictates.
Mesa goes a different way and enables the developer to use the editors he is used to and structure their websites in their
own, preferred way.
  
The CMS also aims to deliver the following features:

* Multi-language sites out of the box
* SEO friendly URL structure
* Extendability
* Fast usage through a modern management interface and a RESTful API.
* Live and preview versions of each page to enable safer editing
* Simple way to backup or move whole pages through only FTP access - the database is a file
* Possibility to freely define the content structure of your documents and backend interface


Requirements / Dependencies
---------------------------

Mesa is built to run on the most webspaces available. Its built to only require:

* PHP 5.6+
* SQLite 3+
* (Memcached) - Optional for faster than disk caching


Installation and Updates
------------------------

To create a project with Mesa, you need to download the project from github and place the following
files on your development server:

* index.php
* cms/*

You can run `cms/install.php` in your browser to set up the system. The install script will try to create a folder
parallel to the `cms/` folder called `lib/` which will contain all your pages contents that are not directly part of
the cms - this way, you can always update the cms without touching the pages contents.

The created lib folder will contain the following structure:

    css/
    data/
     cache/
     templates/
     struct/
     .htaccess
     content.s3db
    img/
    js/
  
The `data/` folder is blocked from direct web access through a `.htaccess` file since it contains files that should
not be accessed through the browser directly. There is the SQLite database which contains the contents of the website
as well as a caching folder (if you choose to use disk caching instead of memcached) and a folder for twig templates and
content structures.

The `css/`, `img/` and `js/` folders are optional and can be created through the install script for you to store assets
for the website into. This is completely up to you and you can always skip that or configure the install script to create
you a different folder structure.

The install script will try to create an admin user for the cms access and a root node for your website.
