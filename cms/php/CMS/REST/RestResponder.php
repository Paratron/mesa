<?php
/**
 * RestResponder
 * =============
 * Basic REST responder class to be extended by the individual components.
 * This class manages
 *
 * @author: Christian Engel <hello@wearekiss.com>
 * @version: 1 19.11.2014
 */

namespace CMS\REST;

class RestResponder {
	/**
	 * @var \CMS\Objects\User
	 */
	var $user = NULL;

	function __construct() {

	}

	function requireToken(){
		if(!isset($_GET['token'])){
			throw new RestError('No access token given', 0);
		}

		global $cache;
		$result = $cache->get('token_' . $_GET['token']);

		if(!$result){
			throw new RestError('Invalid access token given', 1);
		}

		try{
			$this->user = new \CMS\Objects\User($result);
		}
		catch (\ErrorException $e){
			throw new RestError('Unknown user', 5);
		}
	}

	/**
	 * Pushes a message to the current clients browser.
	 * @param $event
	 * @param $data
	 * @param string $masterEvent
	 * @throws \ErrorException
	 */
	function push($event, $data, $masterEvent = 'centralEvent') {
		$pusher = requirePusher();

		$pusher->trigger($this->customer->liveChannel, $masterEvent, array(
				'event' => $event,
				'data' => $data
		));
	}
}