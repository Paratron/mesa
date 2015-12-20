<?php
/**
 * This is responsible for the frontend-redering of the website.
 */
$mesaConfig = parse_ini_file('lib/data/config.ini');

require 'Slim/Slim.php';
\Slim\Slim::registerAutoloader();

$cache = NULL;
if($mesaConfig['cache'] === 'harddrive'){
	$cache = new \Kiss\KVWrappers\Filesystem($mesaConfig['cacheFolder']);
}
if($mesaConfig['cache'] === 'memcached'){
	$cache = new \Kiss\KVWrappers\Memcached();
}
if(!$cache){
	$cache = new \Kiss\KVWrappers\Nullcache();
}

$requestURI = str_replace(dirname($_SERVER['SCRIPT_NAME']), '', $_SERVER['REQUEST_URI']);

$document = $cache->get('page_' . $requestURI);
if($document){
	die($document);
}

$db = new \Kiss\SQLite('lib/data/content.s3db');

$requestURI = explode('/', $requestURI);

foreach($requestURI as $k => $v){
	if(!trim($v)){
		unset($requestURI[$k]);
	}
}

require 'Modules/content/OBJECT_Node.php';

//Root page hit - no URL fragments
if(!count($requestURI)){
	$availableLanguages = \CMS\Objects\Node::getAvailableLanguages();

	//Determine the users language, fallback if necessary
	$langKey = \Kiss\Lang::determineStatic($availableLanguages, $mesaConfig['fallbackLanguage']);

	//Fetch the root node that fits the users language best
	$rootNode = \CMS\Objects\Node::getRootByLanguage($langKey);

    //Does the root node have an url fragment? If so, we need to redirect there.
    if($rootNode->urlFragment){
        header('location: ' . $rootNode->urlFragment);
        die();
    }

	//Fetch the index page of the selected page tree root
	$page = $pageTree->getIndex();
} else {

    //okay we actually have url fragments! whee, lets do the magic now!
    $rootNode = \CMS\Objects\Node::getRootByFragment(array_shift($requestURI));
    $page = \CMS\Objects\Node::getByRequestURI($requestURI, $rootNode);

    //well, if this happens to be a direct jump to an index page - we need to redirect to the parent.
    if($page->groupIndex && array_pop($requestURI) === $page->urlFragment){
        header('location: ./');
        die();
    }
}

if(!$page->liveContent){
    throw new ErrorException('Not published');
}

$html = $page->render();

echo $html;