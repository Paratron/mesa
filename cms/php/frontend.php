<?php
/**
 * This is responsible for the frontend-redering of the website.
 */
$mesaConfig = parse_ini_file('lib/data/config.ini');

require 'Kiss/KeyValueWrapper.php';

$cache = NULL;
if($mesaConfig['cache'] === 'harddrive'){
	require 'Kiss/KVWrappers/Filesystem.php';
	$cache = new \Kiss\KVWrappers\Filesystem($mesaConfig['cacheFolder']);
}
if($mesaConfig['cache'] === 'memcached'){
	require 'Kiss/KVWrappers/Memcached.php';
	$cache = new \Kiss\KVWrappers\Memcached();
}
if(!$cache){
	require 'Kiss/KVWrappers/Nullcache.php';
	$cache = new \Kiss\KVWrappers\Nullcache();
}

$requestURI = str_replace(dirname($_SERVER['SCRIPT_NAME']), '', $_SERVER['REQUEST_URI']);

$document = $cache->get('page_' . $requestURI);
if($document){
	die($document);
}

require 'Kiss/SQLite.php';
$db = new \Kiss\SQLite('lib/data/content.s3db');

$requestURI = explode('/', $requestURI);

die('<pre>' . print_r($_SERVER, TRUE));