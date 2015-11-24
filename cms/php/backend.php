<?php

$mesaConfig = parse_ini_file('../lib/data/config.ini');


require 'Slim/Slim.php';
\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim(array(
		'view' => new \Slim\Views\Twig()
));

$cache = NULL;
if($mesaConfig['cache'] === 'harddrive'){
	require 'Kiss/KVWrappers/Filesystem.php';
	$cache = new \Kiss\KVWrappers\Filesystem('../' . $mesaConfig['cacheFolder']);
}
if($mesaConfig['cache'] === 'memcached'){
	require 'Kiss/KVWrappers/Memcached.php';
	$cache = new \Kiss\KVWrappers\Memcached();
}
if(!$cache){
	require 'Kiss/KVWrappers/Nullcache.php';
	$cache = new \Kiss\KVWrappers\Nullcache();
}

$db = new \Kiss\SQLite('../lib/data/content.s3db');

/**
 * General requests to the interface. Either the login window, or the app itself.
 */
$app->get('/', function () {
	//session_start();

	if (!isset($_SESSION['authKey'])) {
		$_SESSION['authKey'] = '';
	}

	echo \Kiss\Utils::template('@file::data/frontend.html', array(
			'langKey' => \Kiss\Lang::determineStatic(),
			'version' => (string)filemtime('app/cms.js'),
			'authKey' => $_SESSION['authKey']
	));
});

$moduleManager = new \CMS\ModuleManager();


/**
 * Mapping the API requests
 */
$app->map('/api/:route+', function ($route) use ($app) {
	function response($data)
	{
		header('Content-Type: text/json');
		echo json_encode($data);
		die();
	}

	function errorResponse($message, $code = 500, $errorId = 0, $data = NULL)
	{

		$codenames = array(
				'403' => 'Forbidden',
				'404' => 'Not found',
				'405' => 'Method Not Allowed',
				'406' => 'Not Acceptable',
				'500' => 'Internal Server Error',
				'501' => 'Not Implemented',
				'503' => 'Service Unavailable'
		);

		if (!isset($codenames[$code])) {
			$code = 500;
		}

		header('HTTP/1.0 ' . $code . ' ' . $codenames['' . $code]);
		header('Content-Type: text/json');
		echo json_encode(array(
				'error' => array(
						'message' => $message,
						'code' => $errorId,
						'data' => $data
				)
		));
		die();
	}

	$modules = array('content');

	global $moduleManager;
	$moduleManager->fetch($modules);

	$node = ucfirst(strtolower($route[0]));
	$method = strtoupper($app->request()->getMethod());

	$className = '\\CMS\\REST\\' . $node;

	if (!class_exists($className)) {
		$classPath = 'php/CMS/REST/' . $node . '.php';

		if (!file_exists($classPath)) {
			errorResponse('API node not in core and not in loaded modules', 501, 2);
		}

		require $classPath;
	}

	if (!isset($_GET['token']) && $route[0] !== 'user') {
		errorResponse('No access token given', 403, 0);
	}

	global $cache;

	if ($node !== 'User' && !$cache->get('token_' . $_GET['token'])) {
		errorResponse('Invalid access token given', 403, 1);
	}

	$c = new $className();

	if (!method_exists($c, $method)) {
		errorResponse('API method not found', 501, 3);
	}

	try {
		$result = call_user_func(array(
				$c,
				$method
		), json_decode($app->request()->getBody(), TRUE), array_slice($route, 1));
	} catch (\CMS\REST\RestError $e) {
		errorResponse($e->getMessage(), 406, $e->getCode(), $e->data);
	}

	response($result);
})->via('GET', 'POST', 'PUT', 'DELETE');

$app->run();