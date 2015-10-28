<?php
/**
 * This is responsible for the frontend-redering of the website.
 */

require 'Slim/Slim.php';
\Slim\Slim::registerAutoloader();


$app = new \Slim\Slim(array(
		'view' => new \Slim\Views\Twig()
));


$view = $app->view();
$view->setTemplatesDirectory('lib/templates');
$view->parserOptions = array(
		//'cache' => 'lib/cache/twig'
);

require 'lib/config/routes.php';

foreach($routes['get'] as $route => $template){
	$app->get($route, function() use ($app){
		$route = $app->router()->getCurrentRoute();
		$route = $route->getPattern();

		global $routes;

		if(!isset($routes['get'][$route])){
			$app->notFound();
			return;
		}

		$app->render($routes['get'][$route]);
	});
}

$app->run();