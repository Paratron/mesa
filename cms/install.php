<?php
/**
 * mesa setup script
 * =================
 * This script will set everything up to have your mesa project running.
 * You can change a few options here, before running the script:
 */

//Should an admin user be created?
$createAdminUser = TRUE;
$adminMail = 'mail@example.com';
$adminPassword = 'my greatestest password';

//Name of your Website
$pageName = 'My Website';

//Configure here, which folders you want to have inside the "lib/" folder to store page assets inside.
$assetDirectories = array('css', 'img', 'js');


//Will remove any existing data from the database.
$dropExistingTables = array(
	'users' => FALSE,
	'nodes' => TRUE
);

/*
 * =========================================================================
 */

if(isset($_GET['removeInstallScript'])){
	unlink('install.php');
	die('Script removed. <a href="./">Open the CMS backend.</a>');
}

if (!is_writable('../')) {
	die('The parent folder is not writeable.<br>Please create a folder "lib/" next to the "cms/" folder manually and start the install script again.');
}

function checkMakeDir($dir)
{
	if (!is_dir($dir)) {
		mkdir($dir);
	}
}

function logMsg($message)
{
	echo $message . '<br>';
	flush();
}

checkMakeDir('../lib');

if (!is_writable('../lib')) {
	die('The "../lib" folder is not writeable. Cannot continue.');
}

checkMakeDir('../lib/data');
checkMakeDir('../lib/data/cache');
checkMakeDir('../lib/data/struct');
checkMakeDir('../lib/data/templates');
chmod('../lib/data', 0777);
logMsg('Basic folder structure set.');

if (count($assetDirectories)) {
	foreach($assetDirectories as $dir){
		checkMakeDir('../lib/' . $dir);
		logMsg('Created asset folder ../lib/' . $dir);
	}
	logMsg('Asset folders created.');
}

file_put_contents('../lib/data/.htaccess', 'deny from all');
logMsg('"../lib/data" folder secured from web access.');

if (!file_exists('../lib/data/content.s3db')) {
	touch('../lib/data/content.s3db');
	logMsg('Database file created.');
} else {
	logMsg('Database file already exists. Not re-created.');
}

logMsg('');

require 'php/Kiss/SQLite.php';
require 'php/Kiss/Utils.php';

$db = new \Kiss\SQLite('../lib/data/content.s3db');

logMsg('Setting up database...');

$result = $db->createTable('users', array(
	'id' => 'INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL',
	'mail' => 'VARCHAR(256)',
	'password' => 'VARCHAR(72)',
	'username' => 'VARCHAR(128)',
	'lastLogin' => 'INTEGER',
	'loginTries' => 'INTEGER',
	'lastTry' => 'INTEGER'
), $dropExistingTables['users']);
if($result){
	logMsg('User table created.');
} else {
	logMsg('User table NOT created.');
}

if ($createAdminUser) {
	$insert = array(
		'mail' => $adminMail,
		'password' => \Kiss\Utils::hash_password($adminPassword),
		'username' => 'Admin'
	);
	$sql = 'INSERT INTO users ' . $db->makeSqlValueString($insert);
	$db->query($sql);
	logMsg('Admin user created.');
}

$resul = $db->createTable('nodes', array(
	'id' => 'INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL',
	'groupIndex' => 'INTEGER',
	'urlFragment' => 'VARCHAR(128)',
	'parentId' => 'INTEGER',
	'langLink' => 'VARCHAR(128)',
	'langKey' => 'VARCHAR(2)',
	'title' => 'VARCHAR(128)',
	'config' => 'TEXT',
	'content' => 'TEXT',
	'liveContent' => 'TEXT',
	'creationTime' => 'INTEGER',
	'modificationTime' => 'INTEGER',
	'creatorId' => 'INTEGER',
	'modificatorId' => 'INTEGER',
	'structKey' => 'VARCHAR(128)',
	'templateKey' => 'VARCHAR(128)'
), $dropExistingTables['nodes']);
if($result){
	logMsg('Node table created.');
} else {
	logMsg('Node table NOT created.');
}

//Create a root node?
$sql = 'SELECT COUNT(id) FROM nodes WHERE parentId = 0;';
if (!$db->queryValue($sql)) {
	$insert = array(
		'parentId' => 0,
		'title' => $pageName,
		'creationTime' => time(),
		'modificationTime' => time(),
		'creatorId' => 1,
		'modificatorId' => 1
	);
	$sql = 'INSERT INTO nodes ' . $db->makeSqlValueString($insert);
	$db->query($sql);
	logMsg('Root node created.');
} else {
	logMsg('There is already a root node.');
}

logMsg('All done. You should now delete the install.php from the "/cms" folder. <a href="?removeInstallScript">Click here to do it automatically.</a>');